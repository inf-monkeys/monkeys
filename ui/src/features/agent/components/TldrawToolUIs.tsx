/**
 * Tldraw Tool UIs - Agent 工具 UI 组件
 *
 * 这些组件注册到 assistant-ui，让 agent 可以操作 tldraw 画布
 */

import { makeAssistantToolUI } from '@assistant-ui/react';
import type { TLShapePartial } from 'tldraw';

// 全局 editor 引用（通过 TldrawToolsProvider 设置）
let globalEditor: any = null;

export function setTldrawEditor(editor: any) {
  globalEditor = editor;
}

export function getTldrawEditor() {
  return globalEditor;
}

/**
 * 获取画布状态工具
 */
export const TldrawGetCanvasStateToolUI = makeAssistantToolUI({
  toolName: 'tldraw_get_canvas_state',
  render: function TldrawGetCanvasStateTool({ result }) {
    if (!result) return null;

    try {
      const state = JSON.parse(result as string);
      return (
        <div className="rounded-lg border bg-muted/50 p-3 text-sm">
          <div className="font-medium mb-2">📊 Canvas State</div>
          <div className="space-y-1 text-muted-foreground">
            <div>Total shapes: {state.totalShapes}</div>
            <div>Selected: {state.selectedShapes.length}</div>
            {state.selectedShapes.length > 0 && (
              <div className="mt-2">
                <div className="text-xs font-medium mb-1">Selected shapes:</div>
                <div className="text-xs">
                  {state.selectedShapes.map((s: any) => `${s.type} (${s.id})`).join(', ')}
                </div>
              </div>
            )}
          </div>
        </div>
      );
    } catch {
      return <div className="text-sm text-muted-foreground">{String(result)}</div>;
    }
  },
  execute: async () => {
    const editor = getTldrawEditor();
    if (!editor) {
      return JSON.stringify({ error: 'Editor not available' });
    }

    const shapes = editor.getCurrentPageShapes();
    const selectedShapeIds = editor.getSelectedShapeIds();
    const selectedShapes = shapes.filter((s: any) => selectedShapeIds.includes(s.id));

    const state = {
      totalShapes: shapes.length,
      shapes: shapes.map((shape: any) => ({
        id: shape.id,
        type: shape.type,
        x: shape.x,
        y: shape.y,
        rotation: shape.rotation,
        props: shape.props,
      })),
      selectedShapes: selectedShapes.map((shape: any) => ({
        id: shape.id,
        type: shape.type,
        x: shape.x,
        y: shape.y,
        props: shape.props,
      })),
    };

    return JSON.stringify(state, null, 2);
  },
});

/**
 * 创建形状工具
 */
export const TldrawCreateShapeToolUI = makeAssistantToolUI({
  toolName: 'tldraw_create_shape',
  render: function TldrawCreateShapeTool({ args, result }) {
    if (!result) return null;

    return (
      <div className="rounded-lg border bg-muted/50 p-3 text-sm">
        <div className="font-medium mb-1">✏️ Created {args.type} shape</div>
        <div className="text-xs text-muted-foreground">
          {result === 'success' ? 'Shape created successfully' : String(result)}
        </div>
      </div>
    );
  },
  execute: async ({ type, x = 0, y = 0, props }) => {
    const editor = getTldrawEditor();
    if (!editor) {
      return 'Editor not available';
    }

    try {
      const shapePartial: TLShapePartial = {
        type: type as any,
        x,
        y,
        props: props as any,
      };

      editor.createShape(shapePartial);
      return 'success';
    } catch (error) {
      return `Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  },
});

/**
 * 更新形状工具
 */
export const TldrawUpdateShapeToolUI = makeAssistantToolUI({
  toolName: 'tldraw_update_shape',
  render: function TldrawUpdateShapeTool({ args, result }) {
    if (!result) return null;

    return (
      <div className="rounded-lg border bg-muted/50 p-3 text-sm">
        <div className="font-medium mb-1">🔄 Updated shape</div>
        <div className="text-xs text-muted-foreground">
          {result === 'success' ? `Updated shape ${args.shapeId}` : String(result)}
        </div>
      </div>
    );
  },
  execute: async ({ shapeId, updates }) => {
    const editor = getTldrawEditor();
    if (!editor) {
      return 'Editor not available';
    }

    try {
      editor.updateShape({
        id: shapeId,
        type: updates.type,
        ...updates,
      } as any);
      return 'success';
    } catch (error) {
      return `Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  },
});

/**
 * 删除形状工具
 */
export const TldrawDeleteShapesToolUI = makeAssistantToolUI({
  toolName: 'tldraw_delete_shapes',
  render: function TldrawDeleteShapesTool({ args, result }) {
    if (!result) return null;

    return (
      <div className="rounded-lg border bg-muted/50 p-3 text-sm">
        <div className="font-medium mb-1">🗑️ Deleted shapes</div>
        <div className="text-xs text-muted-foreground">
          {result === 'success'
            ? `Deleted ${args.shapeIds?.length || 'selected'} shape(s)`
            : String(result)}
        </div>
      </div>
    );
  },
  execute: async ({ shapeIds = [] }) => {
    const editor = getTldrawEditor();
    if (!editor) {
      return 'Editor not available';
    }

    try {
      const idsToDelete = shapeIds.length > 0
        ? shapeIds
        : Array.from(editor.getSelectedShapeIds());

      if (idsToDelete.length === 0) {
        return 'No shapes to delete';
      }

      editor.deleteShapes(idsToDelete as any);
      return 'success';
    } catch (error) {
      return `Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  },
});

/**
 * 选择形状工具
 */
export const TldrawSelectShapesToolUI = makeAssistantToolUI({
  toolName: 'tldraw_select_shapes',
  render: function TldrawSelectShapesTool({ args, result }) {
    if (!result) return null;

    return (
      <div className="rounded-lg border bg-muted/50 p-3 text-sm">
        <div className="font-medium mb-1">👆 Selected shapes</div>
        <div className="text-xs text-muted-foreground">
          {result === 'success'
            ? `Selected ${args.shapeIds.length} shape(s)`
            : String(result)}
        </div>
      </div>
    );
  },
  execute: async ({ shapeIds }) => {
    const editor = getTldrawEditor();
    if (!editor) {
      return 'Editor not available';
    }

    try {
      editor.setSelectedShapes(shapeIds as any);
      return 'success';
    } catch (error) {
      return `Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  },
});
