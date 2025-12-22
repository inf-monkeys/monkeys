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

    try {
      // 获取所有形状
      const shapes = editor.getCurrentPageShapes();
      console.log('[TldrawGetCanvasState] Total shapes found:', shapes.length);

      // 获取选中的形状 IDs
      const selectedShapeIds = editor.getSelectedShapeIds();
      console.log('[TldrawGetCanvasState] Selected shape IDs:', selectedShapeIds);

      // 过滤选中的形状
      const selectedShapes = shapes.filter((s: any) => selectedShapeIds.includes(s.id));

      // 转换形状数据，使用 page bounds 而不是原始 x/y
      const shapesData = shapes.map((shape: any) => {
        const bounds = editor.getShapePageBounds(shape.id);
        return {
          id: shape.id,
          type: shape.type,
          x: bounds?.x ?? shape.x,
          y: bounds?.y ?? shape.y,
          w: bounds?.w ?? 0,
          h: bounds?.h ?? 0,
          rotation: shape.rotation,
          props: shape.props,
        };
      });

      const selectedShapesData = selectedShapes.map((shape: any) => {
        const bounds = editor.getShapePageBounds(shape.id);
        return {
          id: shape.id,
          type: shape.type,
          x: bounds?.x ?? shape.x,
          y: bounds?.y ?? shape.y,
          w: bounds?.w ?? 0,
          h: bounds?.h ?? 0,
          props: shape.props,
        };
      });

      const state = {
        totalShapes: shapes.length,
        shapes: shapesData,
        selectedShapes: selectedShapesData,
      };

      console.log('[TldrawGetCanvasState] Returning state:', state);
      return JSON.stringify(state, null, 2);
    } catch (error) {
      console.error('[TldrawGetCanvasState] Error:', error);
      return JSON.stringify({ error: String(error) });
    }
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
      console.log('[TldrawCreateShape] Creating shape:', { type, x, y, props });

      // 根据 type 创建正确的 shape
      const shapePartial: TLShapePartial = {
        type: type as any,
        x,
        y,
        props: props as any,
      };

      const createdShapes = editor.createShape(shapePartial);
      console.log('[TldrawCreateShape] Shape created:', createdShapes);

      return 'success';
    } catch (error) {
      console.error('[TldrawCreateShape] Error:', error);
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

/**
 * 创建工作流节点工具
 */
export const TldrawCreateWorkflowToolUI = makeAssistantToolUI({
  toolName: 'tldraw_create_workflow',
  render: function TldrawCreateWorkflowTool({ args, result }) {
    if (!result) return null;

    try {
      const resultData = typeof result === 'string' ? JSON.parse(result) : result;

      if (resultData.error) {
        return (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm">
            <div className="font-medium mb-1 text-red-900">❌ Failed to create workflow</div>
            <div className="text-xs text-red-700">{resultData.error}</div>
          </div>
        );
      }

      return (
        <div className="rounded-lg border bg-muted/50 p-3 text-sm">
          <div className="font-medium mb-1">🔄 Created workflow node</div>
          <div className="text-xs text-muted-foreground">
            <div>Name: {resultData.workflowName}</div>
            <div>ID: {args.workflowId}</div>
            <div>Position: ({args.x || 100}, {args.y || 100})</div>
          </div>
        </div>
      );
    } catch {
      return (
        <div className="rounded-lg border bg-muted/50 p-3 text-sm">
          <div className="font-medium mb-1">🔄 Created workflow node</div>
          <div className="text-xs text-muted-foreground">{String(result)}</div>
        </div>
      );
    }
  },
  execute: async ({ workflowId, x = 100, y = 100, width = 300, height = 200 }) => {
    const editor = getTldrawEditor();
    if (!editor) {
      return JSON.stringify({ error: 'Editor not available' });
    }

    try {
      console.log('[TldrawCreateWorkflow] Creating workflow node:', { workflowId, x, y, width, height });

      // 获取工作流详细信息
      const response = await fetch(`/api/workflow/${workflowId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch workflow: ${response.status}`);
      }

      const workflowData = await response.json();
      const workflow = workflowData.data || workflowData;

      console.log('[TldrawCreateWorkflow] Workflow data:', workflow);

      // 提取输入参数
      const inputParams = (workflow.variables || []).map((variable: any) => ({
        name: variable.name,
        displayName: variable.displayName || variable.name,
        type: variable.type || 'string',
        value: variable.default || '',
        required: variable.required || false,
        description: variable.description || '',
        typeOptions: variable.typeOptions || {},
      }));

      // 创建工作流节点
      const shapePartial: TLShapePartial = {
        type: 'workflow' as any,
        x,
        y,
        props: {
          w: width,
          h: height,
          workflowId: workflow.id || workflowId,
          workflowName: workflow.displayName || workflow.name || 'Unnamed Workflow',
          workflowDescription: workflow.description || '',
          color: 'violet',
          isRunning: false,
          connections: [],
          inputParams,
          inputConnections: [],
          generatedTime: 0,
        } as any,
      };

      const createdShapes = editor.createShape(shapePartial);
      console.log('[TldrawCreateWorkflow] Workflow node created:', createdShapes);

      return JSON.stringify({
        success: true,
        workflowId: workflow.id || workflowId,
        workflowName: workflow.displayName || workflow.name,
        shapeId: createdShapes?.id || 'unknown',
      });
    } catch (error) {
      console.error('[TldrawCreateWorkflow] Error:', error);
      return JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  },
});
