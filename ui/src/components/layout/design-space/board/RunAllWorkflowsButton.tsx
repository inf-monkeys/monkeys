import React from 'react';
import { toast } from 'sonner';
import { Editor, track, useEditor } from 'tldraw';

import { Button } from '@/components/ui/button';

import { getShapePortConnections } from './shapes/ports/portConnections';
import { getWorkflowRuntime } from './shapes/workflow/workflowRuntimeRegistry';

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

function compareByYThenX(editor: Editor, a: string, b: string) {
  const ba = editor.getShapePageBounds(a as any);
  const bb = editor.getShapePageBounds(b as any);
  if (!ba || !bb) return 0;
  // 严格按画布位置排序：先从上到下（Y），再从左到右（X）
  const dy = ba.y - bb.y;
  if (dy !== 0) return dy;
  return ba.x - bb.x;
}

function getConnectedOutputIds(editor: Editor, workflowId: string): string[] {
  const outputs: string[] = [];

  // New port-connection system
  const connections = getShapePortConnections(editor, workflowId as any);
  for (const c of connections) {
    // From workflow's output port (terminal === 'start')
    if (c.terminal === 'start' && c.ownPortId === 'output') {
      const s = editor.getShape(c.connectedShapeId);
      if (s?.type === 'output') outputs.push(c.connectedShapeId as any as string);
    }
  }

  // Fallback: legacy arrow binding (compat)
  if (outputs.length === 0) {
    const allShapes = editor.getCurrentPageShapes();
    const arrows = allShapes.filter((s) => s.type === 'arrow') as any[];

    arrows.forEach((arrow) => {
      const start = arrow.props?.start as any;
      const end = arrow.props?.end as any;
      if (start?.type === 'binding' && start.boundShapeId === workflowId && end?.type === 'binding') {
        const endShape = editor.getShape(end.boundShapeId);
        if (endShape?.type === 'output') outputs.push(end.boundShapeId as any as string);
      }
    });
  }

  return Array.from(new Set(outputs));
}

type OutputSnapshot = {
  id: string;
  type: string;
  props: any;
  meta?: any;
};

function snapshotOutputs(editor: Editor, outputIds: string[]): Map<string, OutputSnapshot> {
  const snap = new Map<string, OutputSnapshot>();
  for (const id of outputIds) {
    const s: any = editor.getShape(id as any);
    if (!s || s.type !== 'output') continue;
    snap.set(id, {
      id: s.id as any as string,
      type: s.type,
      props: s.props,
      meta: s.meta,
    });
  }
  return snap;
}

function restoreOutputs(editor: Editor, snap: Map<string, OutputSnapshot>) {
  for (const [, s] of snap) {
    try {
      editor.updateShape({
        id: s.id as any,
        type: s.type as any,
        props: s.props,
        meta: s.meta,
      } as any);
    } catch {
      // ignore
    }
  }
}

/**
 * Build a workflow-only dependency graph:
 * workflow -> (output shape) -> downstream workflow (via output's output port)
 * also supports direct workflow -> workflow connections (via workflow's output port)
 */
function getWorkflowGraph(editor: Editor): {
  workflowIds: string[];
  workflowSet: Set<string>;
  edges: Map<string, Set<string>>;
  predecessors: Map<string, Set<string>>;
} {
  const shapes = editor.getCurrentPageShapes();
  const workflowIds = shapes.filter((s) => s.type === 'workflow').map((s) => s.id as any as string);

  const workflowSet = new Set(workflowIds);
  const edges = new Map<string, Set<string>>();
  const predecessors = new Map<string, Set<string>>();

  for (const id of workflowIds) {
    edges.set(id, new Set());
    predecessors.set(id, new Set());
  }

  const addEdge = (fromId: string, toId: string) => {
    if (!workflowSet.has(fromId) || !workflowSet.has(toId) || fromId === toId) return;
    const out = edges.get(fromId)!;
    if (out.has(toId)) return;
    out.add(toId);
    predecessors.get(toId)!.add(fromId);
  };

  for (const wfId of workflowIds) {
    const wfConnections = getShapePortConnections(editor, wfId as any);
    const connectedOutputIds: string[] = [];

    for (const c of wfConnections) {
      if (c.terminal === 'start' && c.ownPortId === 'output') {
        const s = editor.getShape(c.connectedShapeId);
        // workflow -> output
        if (s?.type === 'output') {
          connectedOutputIds.push(c.connectedShapeId as any as string);
        }
        // workflow -> workflow (direct)
        if (s?.type === 'workflow') {
          const toId = c.connectedShapeId as any as string;
          addEdge(wfId, toId);
        }
      }
    }

    for (const outId of connectedOutputIds) {
      const outConnections = getShapePortConnections(editor, outId as any);
      for (const c of outConnections) {
        if (c.terminal === 'start' && c.ownPortId === 'output') {
          const target = editor.getShape(c.connectedShapeId);
          if (target?.type === 'workflow') {
            const toId = c.connectedShapeId as any as string;
            addEdge(wfId, toId);
          }
        }
      }
    }
  }

  return { workflowIds, workflowSet, edges, predecessors };
}

function getX(editor: Editor, id: string): number {
  const b = editor.getShapePageBounds(id as any);
  return b?.x ?? 0;
}

/**
 * Group workflow nodes by X-axis into "columns".
 * X-axis serial: columns execute left -> right.
 * Y-axis parallel: within a column, runnable nodes execute in parallel batches.
 */
function groupWorkflowsByX(editor: Editor, workflowIds: string[]): Array<{ x: number; ids: string[] }> {
  // Treat close x positions as the same column to reduce jitter from dragging/snapping.
  const COLUMN_TOLERANCE_PX = 32;
  const idsSortedByX = [...workflowIds].sort((a, b) => getX(editor, a) - getX(editor, b));
  const cols: Array<{ x: number; ids: string[] }> = [];

  for (const id of idsSortedByX) {
    const x = getX(editor, id);
    const last = cols[cols.length - 1];
    if (!last || Math.abs(x - last.x) > COLUMN_TOLERANCE_PX) {
      cols.push({ x, ids: [id] });
    } else {
      last.ids.push(id);
      // keep representative x stable-ish
      last.x = (last.x * (last.ids.length - 1) + x) / last.ids.length;
    }
  }

  // Keep deterministic ordering inside each column (not for execution order, just for stable UI/progress)
  for (const col of cols) {
    col.ids.sort((a, b) => compareByYThenX(editor, a, b));
  }

  return cols.sort((a, b) => a.x - b.x);
}

export const RunAllWorkflowsButton: React.FC = track(() => {
  const editor = useEditor();
  const [running, setRunning] = React.useState(false);
  const [current, setCurrent] = React.useState<{ index: number; total: number } | null>(null);
  const cancelRef = React.useRef(false);

  if (!editor) return null;

  const handleClick = async () => {
    if (running) {
      cancelRef.current = true;
      toast.message('将于当前批次执行结束后停止');
      return;
    }

    cancelRef.current = false;

    const { workflowIds, workflowSet, predecessors } = getWorkflowGraph(editor);
    if (workflowIds.length === 0) {
      toast.message('画布中没有可执行的工作流节点');
      return;
    }

    // Abort if any workflow node is already running
    for (const id of workflowIds) {
      const s: any = editor.getShape(id as any);
      if (s?.type === 'workflow' && s?.props?.isRunning) {
        toast.error('存在正在运行的工作流节点，请先等待其结束或手动停止');
        return;
      }
    }

    setRunning(true);
    setCurrent({ index: 0, total: workflowIds.length });

    try {
      let skippedNoRuntime = 0;
      let skippedNoWorkflowId = 0;
      let failedCount = 0;
      const completed = new Set<string>();
      const cols = groupWorkflowsByX(editor, workflowIds);
      const pending = new Set<string>(workflowIds);

      const markDone = (id: string) => {
        if (!completed.has(id)) {
          completed.add(id);
          pending.delete(id);
          setCurrent({ index: completed.size, total: workflowIds.length });
        }
      };

      // Execute columns left -> right
      for (const col of cols) {
        if (cancelRef.current) break;

        // Only consider nodes still pending (in case we finish them earlier due to weird graphs)
        const remainingInCol = new Set(col.ids.filter((id) => pending.has(id)));

        // Within a column, execute runnable nodes in parallel batches until exhausted
        while (remainingInCol.size > 0) {
          if (cancelRef.current) break;

          const runnable: string[] = [];
          for (const id of remainingInCol) {
            const preds = predecessors.get(id) || new Set<string>();
            let ok = true;
            for (const p of preds) {
              if (workflowSet.has(p) && !completed.has(p)) {
                ok = false;
                break;
              }
            }
            if (ok) runnable.push(id);
          }

          // If nothing is runnable (cycle or dependency points to future columns), break this column loop.
          if (runnable.length === 0) {
            break;
          }

          // For stability, keep runnable list ordered, though they will run in parallel.
          runnable.sort((a, b) => compareByYThenX(editor, a, b));

          // Build tasks (some might be skipped but still marked done to avoid blocking downstream)
          const tasks: Array<{ id: string; runtime: ReturnType<typeof getWorkflowRuntime> }> = [];
          for (const id of runnable) {
            remainingInCol.delete(id);

            const s: any = editor.getShape(id as any);
            if (!s || s.type !== 'workflow') {
              markDone(id);
              continue;
            }

            if (!s.props?.workflowId || String(s.props.workflowId).trim() === '') {
              skippedNoWorkflowId += 1;
              markDone(id);
              continue;
            }

            const runtime = getWorkflowRuntime(id);
            if (!runtime) {
              skippedNoRuntime += 1;
              markDone(id);
              continue;
            }

            tasks.push({ id, runtime });
          }

          // Refresh inputs for the whole batch first, then run the batch in parallel.
          for (const t of tasks) {
            try {
              t.runtime!.refreshInputs();
            } catch {}
          }
          await sleep(120);

          await Promise.all(
            tasks.map(async (t) => {
              // Snapshot current outputs so we can rollback on failure and keep the old result.
              const outputIds = getConnectedOutputIds(editor, t.id);
              const snap = snapshotOutputs(editor, outputIds);
              try {
                await t.runtime!.run();
              } catch {
                // 不展示具体报错信息：回滚到旧结果，并继续向下推进
                failedCount += 1;
                restoreOutputs(editor, snap);
              } finally {
                markDone(t.id);
              }
            }),
          );

          // Small gap to avoid hammering the API/store.
          await sleep(50);
        }
      }

      // Fallback: if some nodes are still pending (cycles / cross-column odd deps), finish them one-by-one by Y->X.
      if (!cancelRef.current && pending.size > 0) {
        const remaining = Array.from(pending).sort((a, b) => compareByYThenX(editor, a, b));
        for (const id of remaining) {
          if (cancelRef.current) break;

          const s: any = editor.getShape(id as any);
          if (!s || s.type !== 'workflow') {
            markDone(id);
            continue;
          }
          if (!s.props?.workflowId || String(s.props.workflowId).trim() === '') {
            skippedNoWorkflowId += 1;
            markDone(id);
            continue;
          }
          const runtime = getWorkflowRuntime(id);
          if (!runtime) {
            skippedNoRuntime += 1;
            markDone(id);
            continue;
          }
          runtime.refreshInputs();
          await sleep(120);
          // Snapshot current outputs so we can rollback on failure and keep the old result.
          const outputIds = getConnectedOutputIds(editor, id);
          const snap = snapshotOutputs(editor, outputIds);
          try {
            await runtime.run();
          } catch {
            failedCount += 1;
            restoreOutputs(editor, snap);
          }
          markDone(id);
          await sleep(50);
        }
      }

      if (cancelRef.current) {
        toast.message('已停止：后续节点未继续执行');
      } else {
        // 不展示具体报错信息；失败/跳过时继续向下推进（使用原结果）。
        // 这里统一给一个“完成”的反馈即可。
        void skippedNoRuntime;
        void skippedNoWorkflowId;
        void failedCount;
        toast.success('已执行完成');
      }
    } catch (e: any) {
      // 不展示具体报错信息
      toast.error('从头运行失败');
    } finally {
      setRunning(false);
      setCurrent(null);
      cancelRef.current = false;
    }
  };

  return (
    <div
      className="pointer-events-none"
      style={{
        position: 'fixed',
        right: 16,
        top: 88,
        zIndex: 999,
      }}
    >
      <Button
        onClick={handleClick}
        variant="outline"
        size="small"
        className="pointer-events-auto bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 shadow-sm"
        disabled={false}
        title="X 轴串行、Y 轴并行：按列从左到右推进，同一列内并行执行（依赖满足后才会开始）"
      >
        {running ? (current ? `运行中 ${current.index}/${current.total}（点我停止）` : '运行中（点我停止）') : '从头运行'}
      </Button>
    </div>
  );
});


