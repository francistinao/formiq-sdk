'use client';

import { create } from 'zustand';

export type CanvasElementType = 'text' | 'qr_code' | 'bar_code' | 'image';

export interface CanvasElementProperties {
  fontFamily: string;
  fontWeight: 'normal' | 'bold';
  italic: boolean;
  underline: boolean;
  fontSize: number;
  textAlign: 'left' | 'center' | 'right';
  color: string;
  opacity: number;
  coordinateSpace?: 'page' | 'stage';
  bindingKey?: string;
  data?: string;
  src?: string;
  text?: string;
  isIncrementalVariable?: boolean;
  generationType?: 'integer' | 'alphanumeric';
  incrementCount?: number;
  incrementStart?: number;
  incrementPadLength?: number;
  incrementSeed?: string;
}

export interface CanvasElement {
  id: string;
  dbId?: number;
  configDbId?: number;
  type: CanvasElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  text?: string;
  data?: string;
  src?: string;
  zIndex: number;
  generationType?: 'integer' | 'alphanumeric';
  properties: CanvasElementProperties;
}

export interface CanvasDataSourceMeta {
  columnHeaders: string[];
  previewRow: Record<string, string>;
}

interface CanvasStore {
  elements: CanvasElement[];
  selectedId: string | null;
  dataSourceMeta: CanvasDataSourceMeta | null;
  colorEyedropped: string | null;
  colorEyedropperActive: boolean;
  setColorEyedropped: (color: string | null) => void;
  setColorEyedropperActive: (active: boolean) => void;
  addElement: (type: CanvasElementType) => void;
  setElements: (elements: CanvasElement[]) => void;
  mergeElements: (incoming: CanvasElement[]) => void;
  updateElement: (id: string, patch: Partial<CanvasElement>) => void;
  updateElementProperties: (id: string, patch: Partial<CanvasElementProperties>) => void;
  updateDimensions: (
    id: string,
    values: Partial<Pick<CanvasElement, 'x' | 'y' | 'width' | 'height'>>
  ) => void;
  removeElement: (id: string) => void;
  bringForward: (id: string) => void;
  sendBackward: (id: string) => void;
  setSelectedId: (id: string | null) => void;
  setDataSourceMeta: (meta: CanvasDataSourceMeta | null) => void;
  assetUrl: string | null;
  setAssetUrl: (url: string | null) => void;
}

function createElement(type: CanvasElementType): CanvasElement {
  const base = {
    id: crypto.randomUUID(),
    x: 220,
    y: 140,
    width: 220,
    height: 40,
    rotation: 0,
  };

  const defaultProperties: CanvasElementProperties = {
    fontFamily: 'Poppins',
    fontWeight: 'bold',
    italic: false,
    underline: false,
    fontSize: 28,
    textAlign: 'left',
    color: '#ffffff',
    opacity: 1,
    coordinateSpace: 'page',
  };

  switch (type) {
    case 'text':
      return {
        ...base,
        type,
        text: '{{Variable_name}}',
        width: 240,
        height: 36,
        zIndex: 0,
        properties: {
          ...defaultProperties,
          fontWeight: 'bold',
          color: '#000000',
          bindingKey: 'Variable_name',
        },
      };
    case 'qr_code':
      return {
        ...base,
        type,
        width: 100,
        height: 100,
        zIndex: 0,
        data: 'https://upload.wikimedia.org/wikipedia/commons/d/d0/QR_code_for_mobile_English_Wikipedia.svg',
        properties: {
          ...defaultProperties,
          fontWeight: 'normal',
          color: '#000000',
          bindingKey: 'qr_data',
          data: 'https://upload.wikimedia.org/wikipedia/commons/d/d0/QR_code_for_mobile_English_Wikipedia.svg',
        },
      };
    case 'bar_code':
      return {
        ...base,
        type,
        width: 240,
        height: 32,
        zIndex: 0,
        data: 'BULK-0001',
        properties: {
          ...defaultProperties,
          fontWeight: 'normal',
          color: '#000000',
          bindingKey: 'barcode_data',
          data: 'BULK-0001',
        },
      };
    case 'image':
      return {
        ...base,
        type,
        width: 190,
        height: 120,
        zIndex: 0,
        src: '/logo.png',
        properties: {
          ...defaultProperties,
          fontWeight: 'normal',
          color: '#000000',
          src: '/logo.png',
        },
      };
  }
}

export const useCanvasStore = create<CanvasStore>((set) => ({
  elements: [],
  selectedId: null,
  dataSourceMeta: null,
  colorEyedropped: null,
  colorEyedropperActive: false,
  setColorEyedropped: (color: string | null) => set({ colorEyedropped: color }),
  setColorEyedropperActive: (active: boolean) => set({ colorEyedropperActive: active }),
  addElement: (type) => {
    const element = createElement(type);
    set((state) => ({
      elements: [...state.elements, element],
      selectedId: element.id,
    }));
  },
  updateElement: (id, patch) =>
    set((state) => ({
      elements: state.elements.map((element) =>
        element.id === id ? { ...element, ...patch } : element
      ),
    })),
  updateElementProperties: (id, patch) =>
    set((state) => ({
      elements: state.elements.map((element) =>
        element.id === id
          ? { ...element, properties: { ...element.properties, ...patch } }
          : element
      ),
    })),
  updateDimensions: (id, values) =>
    set((state) => ({
      elements: state.elements.map((element) =>
        element.id === id ? { ...element, ...values } : element
      ),
    })),
  removeElement: (id) =>
    set((state) => ({
      elements: state.elements.filter((element) => element.id !== id),
      selectedId: state.selectedId === id ? null : state.selectedId,
    })),
  bringForward: (id) =>
    set((state) => ({
      elements: state.elements.map((element) =>
        element.id === id ? { ...element, zIndex: element.zIndex + 1 } : element
      ),
    })),
  sendBackward: (id) =>
    set((state) => ({
      elements: state.elements.map((element) =>
        element.id === id ? { ...element, zIndex: Math.max(0, element.zIndex - 1) } : element
      ),
    })),
  setSelectedId: (id) => set({ selectedId: id }),
  setDataSourceMeta: (meta) => set({ dataSourceMeta: meta }),
  mergeElements: (incoming) =>
    set((state) => {
      const existingDbIds = new Set(
        state.elements.map((e) => e.dbId).filter((id): id is number => id !== undefined)
      );
      const newElements = incoming.filter((e) => e.dbId !== undefined && !existingDbIds.has(e.dbId));
      if (newElements.length === 0) return state;
      return { elements: [...state.elements, ...newElements] };
    }),
  setElements: (elements) =>
    set((state) => {
      if (!state.selectedId) {
        return { elements, selectedId: null };
      }

      const selectedById = elements.find((element) => element.id === state.selectedId);
      if (selectedById) {
        return { elements, selectedId: selectedById.id };
      }

      const previousSelected = state.elements.find((element) => element.id === state.selectedId);
      if (previousSelected?.dbId) {
        const selectedByDbId = elements.find((element) => element.dbId === previousSelected.dbId);
        return { elements, selectedId: selectedByDbId?.id ?? null };
      }

      return { elements, selectedId: null };
    }),
  assetUrl: null,
  setAssetUrl: (url) => set({ assetUrl: url }),
}));
