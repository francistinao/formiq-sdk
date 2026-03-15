'use client';

import type {
  CanvasElement,
  CanvasElementType,
  CanvasElementProperties,
} from '../../stores/canvasStore';

interface RawCanvasElement {
  id: number;
  canvasElementConfigId?: number;
  type: CanvasElementType;
  x: number;
  y: number;
  rotation?: number;
  width: number;
  height: number;
  zIndex: number;
  properties: Record<string, unknown> | null;
  data?: string | null;
  text?: string | null;
  src?: string | null;
}

const DEFAULT_PROPERTIES: CanvasElementProperties = {
  fontFamily: 'Poppins',
  fontWeight: 'bold',
  italic: false,
  underline: false,
  fontSize: 24,
  textAlign: 'left',
  color: '#ffffff',
  opacity: 1,
};

function normalizeTextAlign(value: unknown): CanvasElementProperties['textAlign'] {
  if (value === 'center' || value === 'right') {
    return value;
  }
  return 'left';
}

function normalizeFontWeight(value: unknown): CanvasElementProperties['fontWeight'] {
  return value === 'bold' ? 'bold' : 'normal';
}

function normalizeBoolean(value: unknown, fallback = false): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

export function mapCanvasElement(element: RawCanvasElement): CanvasElement {
  const rawProps = element.properties ?? {};

  const properties: CanvasElementProperties = {
    fontFamily:
      typeof rawProps.fontFamily === 'string' ? rawProps.fontFamily : DEFAULT_PROPERTIES.fontFamily,
    fontWeight: normalizeFontWeight(rawProps.fontWeight),
    italic: normalizeBoolean(
      rawProps.italic,
      normalizeBoolean(rawProps.isItalicText, DEFAULT_PROPERTIES.italic)
    ),
    underline: normalizeBoolean(
      rawProps.underline,
      normalizeBoolean(rawProps.isUnderlineText, DEFAULT_PROPERTIES.underline)
    ),
    fontSize: typeof rawProps.fontSize === 'number' ? rawProps.fontSize : DEFAULT_PROPERTIES.fontSize,
    textAlign: normalizeTextAlign(rawProps.textAlign),
    color: typeof rawProps.color === 'string' ? rawProps.color : DEFAULT_PROPERTIES.color,
    opacity: typeof rawProps.opacity === 'number' ? rawProps.opacity : DEFAULT_PROPERTIES.opacity,
    coordinateSpace: rawProps.coordinateSpace === 'page' ? 'page' : 'stage',
    bindingKey:
      typeof rawProps.bindingKey === 'string'
        ? rawProps.bindingKey
        : typeof rawProps.bindingKey === 'number'
          ? String(rawProps.bindingKey)
          : undefined,
    data:
      typeof rawProps.data === 'string'
        ? rawProps.data
        : typeof element.data === 'string'
          ? element.data
          : undefined,
    src:
      typeof rawProps.src === 'string'
        ? rawProps.src
        : typeof element.src === 'string'
          ? element.src
          : undefined,
    isIncrementalVariable:
      typeof rawProps.isIncrementalVariable === 'boolean' ? rawProps.isIncrementalVariable : false,
    generationType:
      rawProps.generationType === 'alphanumeric' || rawProps.generationType === 'integer'
        ? rawProps.generationType
        : undefined,
    incrementCount:
      typeof rawProps.incrementCount === 'number' && Number.isFinite(rawProps.incrementCount)
        ? rawProps.incrementCount
        : undefined,
    incrementStart:
      typeof rawProps.incrementStart === 'number' && Number.isFinite(rawProps.incrementStart)
        ? rawProps.incrementStart
        : undefined,
    incrementPadLength:
      typeof rawProps.incrementPadLength === 'number' &&
      Number.isFinite(rawProps.incrementPadLength)
        ? rawProps.incrementPadLength
        : undefined,
    incrementSeed: typeof rawProps.incrementSeed === 'string' ? rawProps.incrementSeed : undefined,
  };

  return {
    id: element.id.toString(),
    dbId: element.id,
    configDbId: element.canvasElementConfigId,
    type: element.type,
    x: element.x,
    y: element.y,
    rotation: element.rotation ?? 0,
    width: element.width,
    height: element.height,
    zIndex: element.zIndex,
    generationType: properties.generationType,
    text:
      typeof rawProps.text === 'string'
        ? rawProps.text
        : element.type === 'text' && properties.bindingKey
          ? `{{${properties.bindingKey}}}`
          : undefined,
    data: properties.data,
    src: properties.src,
    properties,
  };
}
