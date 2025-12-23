/**
 * TldrawCanvasContext - 提供 tldraw editor 实例给 Agent
 *
 * 用于让 Agent 能够访问和分析画布内容
 */

import { Editor } from '@tldraw/tldraw';
import { createContext, useContext, type ReactNode } from 'react';

interface TldrawCanvasContextValue {
  editor: Editor | null;
  getCanvasData: () => any;
  getSelectedShapeIds: () => string[];
  getViewport: () => { x: number; y: number; zoom: number };
}

const TldrawCanvasContext = createContext<TldrawCanvasContextValue | null>(null);

export interface TldrawCanvasProviderProps {
  editor: Editor | null;
  children: ReactNode;
}

export function TldrawCanvasProvider({ editor, children }: TldrawCanvasProviderProps) {
  const getCanvasData = () => {
    if (!editor) return null;

    try {
      // 获取所有形状
      const shapes = editor.getCurrentPageShapes();

      return {
        shapes: shapes.map((shape) => ({
          id: shape.id,
          type: shape.type,
          props: shape.props,
          x: shape.x,
          y: shape.y,
          rotation: shape.rotation,
        })),
        pageId: editor.getCurrentPageId(),
      };
    } catch (error) {
      console.warn('[TldrawCanvasContext] Failed to get canvas data:', error);
      return null;
    }
  };

  const getSelectedShapeIds = () => {
    if (!editor) return [];
    try {
      return Array.from(editor.getSelectedShapeIds());
    } catch (error) {
      console.warn('[TldrawCanvasContext] Failed to get selected shapes:', error);
      return [];
    }
  };

  const getViewport = () => {
    if (!editor) return { x: 0, y: 0, zoom: 1 };
    try {
      const viewport = editor.getViewportPageBounds();
      const zoom = editor.getZoomLevel();
      return {
        x: viewport.x,
        y: viewport.y,
        zoom,
      };
    } catch (error) {
      console.warn('[TldrawCanvasContext] Failed to get viewport:', error);
      return { x: 0, y: 0, zoom: 1 };
    }
  };

  return (
    <TldrawCanvasContext.Provider
      value={{
        editor,
        getCanvasData,
        getSelectedShapeIds,
        getViewport,
      }}
    >
      {children}
    </TldrawCanvasContext.Provider>
  );
}

export function useTldrawCanvas() {
  return useContext(TldrawCanvasContext);
}
