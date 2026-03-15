export type Rect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type Bounds = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type PageSizePoints = {
  width: number;
  height: number;
};

export type AssetDimensions = {
  width?: number;
  height?: number;
};

type PaperSize = 'A4' | 'Long' | 'Short' | 'Custom';

export type PageConfigInput = {
  paperSize?: PaperSize | string;
  customWidthMm?: number | null;
  customHeightMm?: number | null;
  orientation?: 'PORTRAIT' | 'LANDSCAPE' | null;
} | null;

const A4_POINTS: PageSizePoints = {
  width: 595.28,
  height: 841.89,
};

function safeNumber(value: number) {
  if (!Number.isFinite(value) || value <= 0) {
    return 1;
  }
  return value;
}

export function mmToPt(mm: number) {
  return (mm * 72) / 25.4;
}

export function getPageSizePoints(config: PageConfigInput): PageSizePoints {
  let size: PageSizePoints;

  if (!config?.paperSize || config.paperSize === 'A4') {
    size = A4_POINTS;
  } else if (config.paperSize === 'Long') {
    size = { width: 612, height: 1008 };
  } else if (config.paperSize === 'Short') {
    size = { width: 612, height: 792 };
  } else if (config.paperSize === 'Custom') {
    const widthMm = config.customWidthMm ?? 210;
    const heightMm = config.customHeightMm ?? 297;
    size = { width: mmToPt(widthMm), height: mmToPt(heightMm) };
  } else {
    size = A4_POINTS;
  }

  if (config?.orientation === 'LANDSCAPE') {
    return { width: size.height, height: size.width };
  }

  return size;
}

export function clampRectToPage(rect: Rect, page: PageSizePoints): Rect {
  const width = Math.max(1, Math.min(rect.width, page.width));
  const height = Math.max(1, Math.min(rect.height, page.height));

  return {
    x: Math.max(0, Math.min(rect.x, page.width - width)),
    y: Math.max(0, Math.min(rect.y, page.height - height)),
    width,
    height,
  };
}

export function rectPageToCanvas(rect: Rect, bounds: Bounds, page: PageSizePoints): Rect {
  const pageWidth = safeNumber(page.width);
  const pageHeight = safeNumber(page.height);
  const boundsWidth = safeNumber(bounds.width);
  const boundsHeight = safeNumber(bounds.height);

  return {
    x: bounds.x + (rect.x / pageWidth) * boundsWidth,
    y: bounds.y + (rect.y / pageHeight) * boundsHeight,
    width: (rect.width / pageWidth) * boundsWidth,
    height: (rect.height / pageHeight) * boundsHeight,
  };
}

export function rectCanvasToPage(rect: Rect, bounds: Bounds, page: PageSizePoints): Rect {
  const pageWidth = safeNumber(page.width);
  const pageHeight = safeNumber(page.height);
  const boundsWidth = safeNumber(bounds.width);
  const boundsHeight = safeNumber(bounds.height);

  const pageRect = {
    x: ((rect.x - bounds.x) / boundsWidth) * pageWidth,
    y: ((rect.y - bounds.y) / boundsHeight) * pageHeight,
    width: (rect.width / boundsWidth) * pageWidth,
    height: (rect.height / boundsHeight) * pageHeight,
  };

  return clampRectToPage(pageRect, page);
}

export function legacyStageRectToPage(
  legacyStageRect: Rect,
  legacyTemplateBounds: Bounds,
  page: PageSizePoints
): Rect {
  return rectCanvasToPage(legacyStageRect, legacyTemplateBounds, page);
}

export function computeTemplateBoundsFromPage(
  stage: { width: number; height: number },
  page: PageSizePoints
): Bounds {
  const maxWidth = stage.width * 0.8;
  const maxHeight = stage.height * 0.75;
  const pageAspect = safeNumber(page.width) / safeNumber(page.height);

  let width = maxWidth;
  let height = width / pageAspect;

  if (height > maxHeight) {
    height = maxHeight;
    width = height * pageAspect;
  }

  const yOffset = (stage.height - height) / 2;

  return {
    x: (stage.width - width) / 2,
    y: Math.max(stage.height * 0.1, yOffset),
    width,
    height,
  };
}

export function computeLegacyTemplateBounds(
  stage: { width: number; height: number },
  assetNatural: { width?: number; height?: number }
): Bounds {
  const naturalWidth = assetNatural.width ?? stage.width * 0.8;
  const naturalHeight = assetNatural.height ?? stage.height * 0.6;
  const widthScale = (stage.width * 0.8) / safeNumber(naturalWidth);
  const heightScale = (stage.height * 0.75) / safeNumber(naturalHeight);
  const assetScale = Math.min(widthScale, heightScale, 1);
  const width = naturalWidth * assetScale;
  const height = naturalHeight * assetScale;
  const yOffset = (stage.height - height) / 2;

  return {
    x: (stage.width - width) / 2,
    y: Math.max(stage.height * 0.1, yOffset),
    width,
    height,
  };
}

export function computeContainedBounds(
  container: Bounds,
  content: { width?: number; height?: number }
): Bounds {
  const contentWidth = content.width ?? container.width;
  const contentHeight = content.height ?? container.height;

  const containerWidth = safeNumber(container.width);
  const containerHeight = safeNumber(container.height);
  const sourceWidth = safeNumber(contentWidth);
  const sourceHeight = safeNumber(contentHeight);

  const scale = Math.min(containerWidth / sourceWidth, containerHeight / sourceHeight);
  const width = sourceWidth * scale;
  const height = sourceHeight * scale;

  return {
    x: container.x + (containerWidth - width) / 2,
    y: container.y + (containerHeight - height) / 2,
    width,
    height,
  };
}

export function computeAutoRowsForPage(params: {
  pageSize: PageSizePoints;
  columns: number;
  marginTopMm?: number | null;
  marginRightMm?: number | null;
  marginBottomMm?: number | null;
  marginLeftMm?: number | null;
  assetDimensions?: AssetDimensions | null;
  fallbackRows?: number;
  maxRows?: number;
}) {
  const columnCount = Math.max(1, Math.floor(params.columns));
  const fallbackRows = Math.max(1, Math.floor(params.fallbackRows ?? 1));
  const maxRows = Math.max(1, Math.floor(params.maxRows ?? 50));
  const assetWidth = params.assetDimensions?.width;
  const assetHeight = params.assetDimensions?.height;

  if (
    !Number.isFinite(assetWidth) ||
    !Number.isFinite(assetHeight) ||
    Number(assetWidth) <= 0 ||
    Number(assetHeight) <= 0
  ) {
    return Math.min(fallbackRows, maxRows);
  }

  const printableWidth = Math.max(
    1,
    params.pageSize.width -
      Math.max(0, mmToPt(params.marginLeftMm ?? 0)) -
      Math.max(0, mmToPt(params.marginRightMm ?? 0))
  );
  const printableHeight = Math.max(
    1,
    params.pageSize.height -
      Math.max(0, mmToPt(params.marginTopMm ?? 0)) -
      Math.max(0, mmToPt(params.marginBottomMm ?? 0))
  );
  const slotWidth = printableWidth / columnCount;
  const slotHeight = (Number(assetHeight) * slotWidth) / Number(assetWidth);

  if (!Number.isFinite(slotHeight) || slotHeight <= 0) {
    return Math.min(fallbackRows, maxRows);
  }

  return Math.max(1, Math.min(maxRows, Math.floor(printableHeight / slotHeight)));
}
