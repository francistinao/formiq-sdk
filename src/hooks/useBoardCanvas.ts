'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { KonvaEventObject } from 'konva/lib/Node';
import type { Stage } from 'konva/lib/Stage';
import type { Vector2d } from 'konva/lib/types';

import { useCanvasElement } from './useCanvasElement';
import type { CanvasElementProperties, CanvasElementType } from '../stores/canvasStore';
import { useCanvasStore } from '../stores/canvasStore';

type UseBoardCanvasOptions = {
  canEdit?: boolean;
};

export function useBoardCanvas(boardId: string, options?: UseBoardCanvasOptions) {
  const canEdit = options?.canEdit ?? true;
  const { upsertCanvasElement } = useCanvasElement(boardId, { canEdit });
  const updateElement = useCanvasStore((state) => state.updateElement);
  const stageRef = useRef<Stage | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [stageSize, setStageSize] = useState({ width: 800, height: 600 });
  const [stageScale, setStageScale] = useState(1);
  const [stagePosition, setStagePosition] = useState({ x: 0, y: 0 });
  const isPanning = useRef(false);
  const panStartPoint = useRef<Vector2d | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver(() => {
      const width = Math.max(containerRef.current?.clientWidth ?? 0, 400);
      const height = Math.max(containerRef.current?.clientHeight ?? 0, 320);
      const windowHeight = typeof window !== 'undefined' ? window.innerHeight : 900;
      const maxHeight = Math.max(windowHeight - 220, 480);
      setStageSize({ width, height: Math.min(height, maxHeight) });
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const handleWheel = useCallback(
    (event: KonvaEventObject<WheelEvent>) => {
      const stage = stageRef.current;
      if (!stage) return;
      event.evt.preventDefault();
      const oldScale = stageScale;
      const pointer = stage.getPointerPosition();
      if (!pointer) return;
      const scaleBy = 1.08;
      const newScale = Math.min(
        2.4,
        Math.max(0.5, event.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy)
      );
      const mousePointTo = {
        x: (pointer.x - stagePosition.x) / oldScale,
        y: (pointer.y - stagePosition.y) / oldScale,
      };
      const newPos = {
        x: pointer.x - mousePointTo.x * newScale,
        y: pointer.y - mousePointTo.y * newScale,
      };
      setStageScale(newScale);
      setStagePosition(newPos);
    },
    [stageScale, stagePosition]
  );

  const handleMouseDown = useCallback((event: KonvaEventObject<MouseEvent>) => {
    if (event.target === event.target.getStage()) {
      isPanning.current = true;
      panStartPoint.current = stageRef.current?.getPointerPosition() ?? null;
    }
  }, []);

  const handleMouseMove = useCallback(() => {
    if (!isPanning.current) return;
    const pointer = stageRef.current?.getPointerPosition();
    if (!pointer || !panStartPoint.current) return;
    const dx = pointer.x - panStartPoint.current.x;
    const dy = pointer.y - panStartPoint.current.y;
    setStagePosition((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
    panStartPoint.current = pointer;
  }, []);

  const handleMouseUp = useCallback(() => {
    isPanning.current = false;
    panStartPoint.current = null;
  }, []);

  const registerContainer = useCallback((node: HTMLDivElement | null) => {
    containerRef.current = node;
  }, []);

  type BoardCanvasElement = {
    id: string;
    dbId?: number;
    configDbId?: number;
    type: CanvasElementType;
    x: number;
    y: number;
    rotation?: number;
    width: number;
    height: number;
    zIndex: number;
    properties: CanvasElementProperties;
  };

  const handleDragEnd = useCallback(
    (
      element: BoardCanvasElement,
      x: number,
      y: number,
      properties: CanvasElementProperties = element.properties
    ) => {
      if (!canEdit) {
        return;
      }

      updateElement(element.id, { x, y });
      upsertCanvasElement(
        {
          id: element.dbId,
          clientId: element.id,
          canvasElementConfigId: element.configDbId,
          boardId,
          type: element.type,
          x,
          y,
          rotation: element.rotation,
          width: element.width,
          height: element.height,
          zIndex: element.zIndex,
          properties,
        },
        (dbId, configDbId) => updateElement(element.id, { dbId, configDbId }),
        { immediate: true }
      );
    },
    [canEdit, upsertCanvasElement, updateElement, boardId]
  );

  const handleTransformEnd = useCallback(
    (
      element: BoardCanvasElement,
      values: { x: number; y: number; width: number; height: number; rotation: number },
      properties: CanvasElementProperties = element.properties
    ) => {
      if (!canEdit) {
        return;
      }

      const { x, y, width, height, rotation } = values;
      updateElement(element.id, { x, y, rotation, width, height });
      upsertCanvasElement(
        {
          id: element.dbId,
          clientId: element.id,
          canvasElementConfigId: element.configDbId,
          boardId,
          type: element.type,
          x,
          y,
          rotation,
          width,
          height,
          zIndex: element.zIndex,
          properties,
        },
        (dbId, configDbId) => updateElement(element.id, { dbId, configDbId }),
        { immediate: true }
      );
    },
    [canEdit, upsertCanvasElement, updateElement, boardId]
  );

  return {
    stageRef,
    registerContainer,
    stageSize,
    stageScale,
    stagePosition,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleWheel,
    setStagePosition,
    handleDragEnd,
    handleTransformEnd,
  };
}
