'use client';

import type { KonvaEventObject } from 'konva/lib/Node';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import useImage from 'use-image';

import { useBoardCanvas } from '../../hooks/useBoardCanvas';
import type { CanvasElement, CanvasElementType } from '../../stores/canvasStore';
import { useCanvasStore } from '../../stores/canvasStore';
import type { BoardEditorPayload } from '../../types/board.types';
import {
  computeContainedBounds,
  computeLegacyTemplateBounds,
  computeTemplateBoundsFromPage,
  getPageSizePoints,
  legacyStageRectToPage,
  rectCanvasToPage,
  rectPageToCanvas,
} from '../../utils/canvas/pdfCoordinates';

type KonvaImageComponent = (typeof import('react-konva'))['Image'];

function CanvasImageElement({
  KonvaImage,
  sharedProps,
  src,
  placeholder,
  width,
  height,
  opacity,
}: {
  KonvaImage: KonvaImageComponent;
  sharedProps: object;
  src: string | undefined;
  placeholder: HTMLImageElement | undefined;
  width: number;
  height: number;
  opacity: number;
}) {
  const [uploadedImage] = useImage(src ?? '', 'anonymous');
  return (
    <KonvaImage
      {...sharedProps}
      image={src ? uploadedImage : placeholder}
      width={width}
      height={height}
      opacity={opacity}
    />
  );
}

const IMAGE_URL_RE = /\.(png|jpe?g|gif|webp|bmp|svg|avif|tiff?)(\?.*)?$/i;

function looksLikeImageUrl(value: string): boolean {
  if (!/^https?:\/\//i.test(value)) return false;
  return IMAGE_URL_RE.test(value);
}

const TYPE_LABELS: Record<CanvasElementType, string> = {
  text: 'Text',
  qr_code: 'QR Code',
  bar_code: 'Bar Code',
  image: 'Image',
};

const QR_PLACEHOLDER_SRC = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
  <rect width="120" height="120" fill="#ffffff"/>
  <rect x="8" y="8" width="32" height="32" fill="#111827"/>
  <rect x="13" y="13" width="22" height="22" fill="#ffffff"/>
  <rect x="18" y="18" width="12" height="12" fill="#111827"/>
  <rect x="80" y="8" width="32" height="32" fill="#111827"/>
  <rect x="85" y="13" width="22" height="22" fill="#ffffff"/>
  <rect x="90" y="18" width="12" height="12" fill="#111827"/>
  <rect x="8" y="80" width="32" height="32" fill="#111827"/>
  <rect x="13" y="85" width="22" height="22" fill="#ffffff"/>
  <rect x="18" y="90" width="12" height="12" fill="#111827"/>
  <rect x="50" y="50" width="8" height="8" fill="#111827"/>
  <rect x="62" y="50" width="8" height="8" fill="#111827"/>
  <rect x="50" y="62" width="8" height="8" fill="#111827"/>
  <rect x="74" y="62" width="8" height="8" fill="#111827"/>
  <rect x="62" y="74" width="8" height="8" fill="#111827"/>
  <rect x="86" y="50" width="8" height="8" fill="#111827"/>
  <rect x="74" y="86" width="8" height="8" fill="#111827"/>
  <rect x="94" y="74" width="8" height="8" fill="#111827"/>
</svg>
`)}`;

const BARCODE_PLACEHOLDER_SRC = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 80">
  <rect width="240" height="80" fill="#ffffff"/>
  <g fill="#111827">
    <rect x="18" y="10" width="4" height="52"/>
    <rect x="26" y="10" width="2" height="52"/>
    <rect x="32" y="10" width="6" height="52"/>
    <rect x="42" y="10" width="3" height="52"/>
    <rect x="49" y="10" width="5" height="52"/>
    <rect x="58" y="10" width="2" height="52"/>
    <rect x="64" y="10" width="7" height="52"/>
    <rect x="75" y="10" width="3" height="52"/>
    <rect x="82" y="10" width="6" height="52"/>
    <rect x="92" y="10" width="2" height="52"/>
    <rect x="98" y="10" width="5" height="52"/>
    <rect x="108" y="10" width="4" height="52"/>
    <rect x="116" y="10" width="2" height="52"/>
    <rect x="122" y="10" width="6" height="52"/>
    <rect x="132" y="10" width="3" height="52"/>
    <rect x="139" y="10" width="5" height="52"/>
    <rect x="148" y="10" width="2" height="52"/>
    <rect x="154" y="10" width="7" height="52"/>
    <rect x="165" y="10" width="3" height="52"/>
    <rect x="172" y="10" width="5" height="52"/>
    <rect x="181" y="10" width="2" height="52"/>
    <rect x="187" y="10" width="6" height="52"/>
    <rect x="197" y="10" width="3" height="52"/>
    <rect x="204" y="10" width="5" height="52"/>
    <rect x="213" y="10" width="4" height="52"/>
  </g>
  <text x="120" y="74" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="#6b7280">123456789012</text>
</svg>
`)}`;

const IMAGE_PLACEHOLDER_SRC = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 100">
  <rect width="160" height="100" fill="#f3f4f6"/>
  <rect x="6" y="6" width="148" height="88" rx="8" fill="#ffffff" stroke="#cbd5e1" stroke-width="2"/>
  <circle cx="48" cy="35" r="10" fill="#d1d5db"/>
  <path d="M20 78 L58 50 L78 66 L98 56 L138 78 Z" fill="#cbd5e1"/>
  <path d="M20 78 L44 62 L62 74 L84 58 L118 78 Z" fill="#9ca3af" opacity="0.9"/>
</svg>
`)}`;

type BoardCanvasProps = {
  boardId: string;
  board: BoardEditorPayload['board'] | null | undefined;
  canEdit?: boolean;
};

export function BoardCanvas({ boardId, board, canEdit = true }: BoardCanvasProps) {
  const [konva, setKonva] = useState<null | typeof import('react-konva')>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    let active = true;
    setIsClient(true);
    void import('react-konva').then((module) => {
      if (!active) return;
      setKonva(module);
    });
    return () => {
      active = false;
    };
  }, []);

  const KonvaImage = konva?.Image;

  const {
    registerContainer,
    stageRef,
    stageSize,
    stageScale,
    stagePosition,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleWheel,
    handleDragEnd,
    handleTransformEnd,
  } = useBoardCanvas(boardId, { canEdit });

  const elements = useCanvasStore((state) => state.elements);
  const selectedId = useCanvasStore((state) => state.selectedId);
  const setSelectedId = useCanvasStore((state) => state.setSelectedId);
  const updateElement = useCanvasStore((state) => state.updateElement);
  const assetUrl = useCanvasStore((state) => state.assetUrl);
  const dataSourceMeta = useCanvasStore((state) => state.dataSourceMeta);
  const colorEyedropperActive = useCanvasStore((state) => state.colorEyedropperActive);
  const setColorEyedropped = useCanvasStore((state) => state.setColorEyedropped);
  const setColorEyedropperActive = useCanvasStore((state) => state.setColorEyedropperActive);
  const selectedElement = useMemo(
    () => elements.find((element) => element.id === selectedId) ?? null,
    [elements, selectedId]
  );
  const skipSelectionUntilRef = useRef(0);

  const handleSelect = useCallback(
    (id: string) => {
      setSelectedId(id);
    },
    [setSelectedId]
  );

  const [assetImage] = useImage(assetUrl ?? '', 'anonymous');
  const [qrPlaceholderImage] = useImage(QR_PLACEHOLDER_SRC, 'anonymous');
  const [barcodePlaceholderImage] = useImage(BARCODE_PLACEHOLDER_SRC, 'anonymous');
  const [imagePlaceholderImage] = useImage(IMAGE_PLACEHOLDER_SRC, 'anonymous');
  const pageSize = useMemo(
    () =>
      getPageSizePoints({
        ...board?.config,
        orientation: board?.orientation,
      }),
    [board?.config, board?.orientation]
  );

  const cardBounds = useMemo(() => {
    return computeTemplateBoundsFromPage(stageSize, pageSize);
  }, [stageSize, pageSize]);

  const legacyCardBounds = useMemo(() => {
    return computeLegacyTemplateBounds(stageSize, {
      width: assetImage?.width,
      height: assetImage?.height,
    });
  }, [stageSize, assetImage]);
  const assetBounds = useMemo(() => {
    if (!assetImage) {
      return cardBounds;
    }

    return computeContainedBounds(cardBounds, {
      width: assetImage.width,
      height: assetImage.height,
    });
  }, [assetImage, cardBounds]);
  const selectedElementCanvasRect = useMemo(() => {
    if (!selectedElement) {
      return null;
    }

    const pageRect =
      selectedElement.properties.coordinateSpace === 'page'
        ? {
            x: selectedElement.x,
            y: selectedElement.y,
            width: selectedElement.width,
            height: selectedElement.height,
          }
        : legacyStageRectToPage(
            {
              x: selectedElement.x,
              y: selectedElement.y,
              width: selectedElement.width,
              height: selectedElement.height,
            },
            legacyCardBounds,
            pageSize
          );

    return rectPageToCanvas(pageRect, cardBounds, pageSize);
  }, [selectedElement, legacyCardBounds, pageSize, cardBounds]);
  const innerBounds = useMemo(
    () => ({
      x: cardBounds.x + 10,
      y: cardBounds.y + 10,
      width: cardBounds.width - 20,
      height: cardBounds.height - 20,
    }),
    [cardBounds]
  );

  const sampleCanvasColor = useCallback(
    (event: KonvaEventObject<MouseEvent | TouchEvent>) => {
      if (!colorEyedropperActive) {
        return false;
      }

      const stage = stageRef.current;
      const pointer = stage?.getPointerPosition();
      const layer = stage?.getLayers()[0];
      const canvas = layer?.getNativeCanvasElement();
      const context = canvas?.getContext('2d');

      event.cancelBubble = true;
      event.evt.preventDefault();

      if (!stage || !pointer || !canvas || !context) {
        return true;
      }

      const sampleX = Math.max(
        0,
        Math.min(canvas.width - 1, Math.round((pointer.x / Math.max(1, stage.width())) * canvas.width))
      );
      const sampleY = Math.max(
        0,
        Math.min(canvas.height - 1, Math.round((pointer.y / Math.max(1, stage.height())) * canvas.height))
      );
      const [red, green, blue, alpha] = context.getImageData(sampleX, sampleY, 1, 1).data;

      if (alpha === 0) {
        return true;
      }

      skipSelectionUntilRef.current = Date.now() + 250;
      setColorEyedropped(
        `#${[red, green, blue].map((channel) => channel.toString(16).padStart(2, '0')).join('')}`
      );
      setColorEyedropperActive(false);

      return true;
    },
    [colorEyedropperActive, setColorEyedropped, setColorEyedropperActive, stageRef]
  );

  const renderElement = useCallback(
    (element: CanvasElement) => {
      if (!KonvaImage) {
        return null;
      }

      const pageRect =
        element.properties.coordinateSpace === 'page'
          ? {
              x: element.x,
              y: element.y,
              width: element.width,
              height: element.height,
            }
          : legacyStageRectToPage(
              {
                x: element.x,
                y: element.y,
                width: element.width,
                height: element.height,
              },
              legacyCardBounds,
              pageSize
            );

      const canvasRect = rectPageToCanvas(pageRect, cardBounds, pageSize);

      const sharedProps = {
        id: element.id,
        x: canvasRect.x,
        y: canvasRect.y,
        width: canvasRect.width,
        height: canvasRect.height,
        draggable: canEdit && !colorEyedropperActive,
        onClick: () => {
          if (Date.now() < skipSelectionUntilRef.current) {
            return;
          }
          if (colorEyedropperActive) return;
          handleSelect(element.id);
        },
        onTap: () => {
          if (Date.now() < skipSelectionUntilRef.current) {
            return;
          }
          if (colorEyedropperActive) return;
          handleSelect(element.id);
        },
        onDragEnd: (event: KonvaEventObject<DragEvent>) => {
          if (!canEdit || colorEyedropperActive) return;

          const nextPageRect = rectCanvasToPage(
            {
              x: event.target.x(),
              y: event.target.y(),
              width: canvasRect.width,
              height: canvasRect.height,
            },
            cardBounds,
            pageSize
          );

          const normalizedProperties = {
            ...element.properties,
            coordinateSpace: 'page' as const,
          };

          updateElement(element.id, {
            x: nextPageRect.x,
            y: nextPageRect.y,
            width: nextPageRect.width,
            height: nextPageRect.height,
            properties: normalizedProperties,
          });

          handleDragEnd(element, nextPageRect.x, nextPageRect.y, normalizedProperties);
        },
        onDragMove: (event: KonvaEventObject<DragEvent>) => {
          if (!canEdit || colorEyedropperActive) return;

          const nextPageRect = rectCanvasToPage(
            {
              x: event.target.x(),
              y: event.target.y(),
              width: canvasRect.width,
              height: canvasRect.height,
            },
            cardBounds,
            pageSize
          );
          updateElement(element.id, {
            x: nextPageRect.x,
            y: nextPageRect.y,
            width: nextPageRect.width,
            height: nextPageRect.height,
            properties: {
              ...element.properties,
              coordinateSpace: 'page',
            },
          });
        },
        onTransformEnd: (event: KonvaEventObject<Event>) => {
          if (!canEdit || colorEyedropperActive) return;

          const node = event.target;
          const transformedCanvasRect = {
            x: node.x(),
            y: node.y(),
            width: node.width() * node.scaleX(),
            height: node.height() * node.scaleY(),
          };

          node.scaleX(1);
          node.scaleY(1);

          const nextPageRect = rectCanvasToPage(transformedCanvasRect, cardBounds, pageSize);

          const normalizedProperties = {
            ...element.properties,
            coordinateSpace: 'page' as const,
          };

          updateElement(element.id, {
            x: nextPageRect.x,
            y: nextPageRect.y,
            width: nextPageRect.width,
            height: nextPageRect.height,
            properties: normalizedProperties,
          });

          handleTransformEnd(
            element,
            {
              x: nextPageRect.x,
              y: nextPageRect.y,
              width: nextPageRect.width,
              height: nextPageRect.height,
              rotation: node.rotation(),
            },
            normalizedProperties
          );
        },
      };

      const bindingKey =
        typeof element.properties.bindingKey === 'string' ? element.properties.bindingKey : null;
      const boundPreviewValue = bindingKey ? (dataSourceMeta?.previewRow[bindingKey] ?? null) : null;
      const isImageBinding = boundPreviewValue ? looksLikeImageUrl(boundPreviewValue) : false;

      if (isImageBinding) {
        return (
          <KonvaImage
            key={element.id}
            {...sharedProps}
            image={imagePlaceholderImage ?? undefined}
            width={canvasRect.width}
            height={canvasRect.height}
            opacity={element.properties.opacity}
          />
        );
      }

      if (element.type === 'text') {
        const fontStyle = [element.properties.fontWeight, element.properties.italic ? 'italic' : '']
          .join(' ')
          .trim();
        const textDecoration = element.properties.underline ? 'underline' : '';

        return (
          <Text
            key={element.id}
            {...sharedProps}
            text={element.text ?? '{{Text}}'}
            fontSize={element.properties.fontSize}
            fontFamily={element.properties.fontFamily}
            fontStyle={fontStyle}
            textDecoration={textDecoration}
            fill={element.properties.color}
            padding={8}
            align={element.properties.textAlign}
            verticalAlign="middle"
            opacity={element.properties.opacity}
          />
        );
      }

      if (element.type === 'qr_code') {
        return (
          <KonvaImage
            key={element.id}
            {...sharedProps}
            image={qrPlaceholderImage ?? undefined}
            width={canvasRect.width}
            height={canvasRect.height}
            opacity={element.properties.opacity}
          />
        );
      }

      if (element.type === 'bar_code') {
        return (
          <KonvaImage
            key={element.id}
            {...sharedProps}
            image={barcodePlaceholderImage ?? undefined}
            width={canvasRect.width}
            height={canvasRect.height}
            opacity={element.properties.opacity}
          />
        );
      }

      return (
        <CanvasImageElement
          key={element.id}
          KonvaImage={KonvaImage}
          sharedProps={sharedProps}
          src={element.properties.src ?? element.src}
          placeholder={imagePlaceholderImage ?? undefined}
          width={canvasRect.width}
          height={canvasRect.height}
          opacity={element.properties.opacity}
        />
      );
    },
    [
      handleSelect,
      handleDragEnd,
      handleTransformEnd,
      updateElement,
      cardBounds,
      pageSize,
      legacyCardBounds,
      qrPlaceholderImage,
      barcodePlaceholderImage,
      imagePlaceholderImage,
      canEdit,
      dataSourceMeta,
      colorEyedropperActive,
      KonvaImage,
    ]
  );

  if (!isClient || !konva || !KonvaImage) {
    return <div className="formiq-board-canvas formiq-board-canvas--loading" />;
  }

  const { Stage, Layer, Rect, Text, Label, Tag, Transformer } = konva;

  return (
    <div className="formiq-board-canvas">
      <div
        id="formiq-board-canvas"
        ref={registerContainer}
        className="formiq-board-canvas__stage"
        style={{
          backgroundColor: '#f3f5fb',
          backgroundImage: 'radial-gradient(rgba(15,23,42,0.12) 1.7px, transparent 1px)',
          backgroundSize: '32px 32px',
          cursor: colorEyedropperActive ? 'crosshair' : 'default',
        }}
      >
        <Stage
          ref={stageRef}
          width={stageSize.width}
          height={stageSize.height}
          x={stagePosition.x}
          y={stagePosition.y}
          scaleX={stageScale}
          scaleY={stageScale}
          onWheel={handleWheel}
          onMouseDown={(event) => {
            if (sampleCanvasColor(event)) {
              return;
            }
            handleMouseDown(event);
          }}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onTouchStart={sampleCanvasColor}
          onTouchEnd={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchMove={handleMouseMove}
        >
          <Layer>
            <Rect
              x={cardBounds.x}
              y={cardBounds.y}
              width={cardBounds.width}
              height={cardBounds.height}
              cornerRadius={20}
              fill="#ffffff"
              shadowColor="#0f172a"
              shadowBlur={16}
              shadowOpacity={0.12}
            />
            {assetImage ? (
              <KonvaImage
                image={assetImage}
                x={assetBounds.x}
                y={assetBounds.y}
                width={assetBounds.width}
                height={assetBounds.height}
                cornerRadius={20}
              />
            ) : (
              <Rect
                x={cardBounds.x}
                y={cardBounds.y}
                width={cardBounds.width}
                height={cardBounds.height}
                cornerRadius={20}
                fillLinearGradientColorStops={[0, '#03072b', 0.55, '#0b2b64', 1, '#031a4c']}
                shadowColor="#0f172a"
                shadowBlur={40}
              />
            )}
            <Rect
              x={innerBounds.x}
              y={innerBounds.y}
              width={innerBounds.width}
              height={innerBounds.height}
              cornerRadius={18}
              stroke="#7dd3fc"
              strokeWidth={2}
              dash={[10, 6]}
              opacity={0.5}
            />
            {elements
              .slice()
              .sort((a, b) => a.zIndex - b.zIndex)
              .map((element) => renderElement(element))}
            {selectedElement && selectedElementCanvasRect && (
              <Label
                x={Math.max(selectedElementCanvasRect.x, 0)}
                y={Math.max(selectedElementCanvasRect.y - 28, 0)}
                listening={false}
              >
                <Tag fill="#2563eb" cornerRadius={4} />
                <Text text={TYPE_LABELS[selectedElement.type]} fontSize={12} fill="#fff" padding={6} />
              </Label>
            )}
            {canEdit && selectedId && (
              <Transformer
                ref={(node) => {
                  if (!node) return;
                  const stage = node.getStage();
                  const selectedNode = stage?.findOne(`#${selectedId}`);
                  node.nodes(selectedNode ? [selectedNode] : []);
                }}
                boundBoxFunc={(_oldBox, newBox) => ({
                  ...newBox,
                  width: Math.max(newBox.width, 20),
                  height: Math.max(newBox.height, 20),
                })}
              />
            )}
          </Layer>
        </Stage>
      </div>
    </div>
  );
}
