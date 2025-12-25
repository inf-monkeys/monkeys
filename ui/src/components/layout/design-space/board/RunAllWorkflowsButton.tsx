import React from 'react';
import { toast } from 'sonner';
import { Editor, track, useEditor } from 'tldraw';

import { Button } from '@/components/ui/button';

import { getShapePortConnections } from './shapes/ports/portConnections';
import { refreshWorkflowInputs, runWorkflow } from './shapes/workflow/workflowRunner';

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

// 旧实现依赖组件挂载注册 runtime（视口裁剪会导致不稳定跳过），已改为使用不依赖挂载的 workflowRunner。

function isFileValueReady(value: any): boolean {
  if (value === undefined || value === null) return false;
  if (Array.isArray(value)) return value.length > 0 && value.every((v) => isFileValueReady(v));
  if (typeof value === 'string') {
    const v = value.trim();
    if (!v) return false;
    // blob/data URL 对后端不可用（通常表示还没上传完成或是本地预览）
    if (v.startsWith('blob:') || v.startsWith('data:')) return false;
    return true;
  }
  // 兜底：某些实现可能传对象（例如包含 url / id）
  return true;
}

function getConnectedParamNames(editor: Editor, workflowId: string): Set<string> {
  const names = new Set<string>();
  const connections = getShapePortConnections(editor, workflowId as any);
  for (const c of connections) {
    // 连接到 workflow 的输入端口（terminal === 'end'）
    if (c.terminal === 'end' && typeof c.ownPortId === 'string' && c.ownPortId.startsWith('param_')) {
      names.add(c.ownPortId.replace('param_', ''));
    }
  }
  return names;
}

function getNotReadyFileParamNames(editor: Editor, workflowId: string): string[] {
  const s: any = editor.getShape(workflowId as any);
  if (!s || s.type !== 'workflow') return [];
  const params: any[] = Array.isArray(s.props?.inputParams) ? s.props.inputParams : [];
  if (params.length === 0) return [];

  const connected = getConnectedParamNames(editor, workflowId);
  const pending: string[] = [];
  for (const p of params) {
    if (!p || p.type !== 'file') continue;
    // 只等待“来自连线”的 file 参数就绪：这类值会由上游 output / instruction 自动填充。
    // 对于没有连线、需要用户手动上传的必填文件，不要在这里等待，否则会造成“开始运行卡住”。
    if (!connected.has(p.name)) continue;
    if (!isFileValueReady(p.value)) pending.push(p.name);
  }
  return pending;
}

async function waitForWorkflowFileInputsReady(opts: {
  editor: Editor;
  workflowShapeId: string;
  refreshInputs: () => void;
  cancelRef: React.MutableRefObject<boolean>;
  timeoutMs?: number;
}) {
  const { editor, workflowShapeId, refreshInputs, cancelRef, timeoutMs = 12_000 } = opts;
  const start = Date.now();
  let notified = false;

  while (true) {
    if (cancelRef.current) throw new Error('Canceled');

    // 尝试刷新一次连接输入（这会把 instruction/output 的最新值同步到 inputParams）
    try {
      refreshInputs();
    } catch {}

    // 给 editor 一点时间把 updateShape 落地
    await sleep(50);

    const pendingNames = getNotReadyFileParamNames(editor, workflowShapeId);
    if (pendingNames.length === 0) return;

    const elapsed = Date.now() - start;
    if (!notified && elapsed > 1200) {
      notified = true;
      const s: any = editor.getShape(workflowShapeId as any);
      const name = s?.props?.workflowName ? `「${s.props.workflowName}」` : '该节点';
      toast.message(`等待${name}的图片/文件上传完成...`);
    }
    if (elapsed >= timeoutMs) {
      const s: any = editor.getShape(workflowShapeId as any);
      const name = s?.props?.workflowName ? `「${s.props.workflowName}」` : '该节点';
      toast.message(`等待${name}的图片/文件输入超时，将继续执行（可能失败）`);
      return;
    }
    await sleep(200);
  }
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

export const RunAllWorkflowsButton: React.FC = track(() => {
  const editor = useEditor();
  return <RunAllWorkflowsButtonBase editor={editor} mode="floating" />;
});

type RunAllWorkflowsButtonMode = 'floating' | 'inline';

export const RunAllWorkflowsButtonStandalone: React.FC<{
  editor: Editor | null;
  mode?: RunAllWorkflowsButtonMode;
  className?: string;
}> = ({ editor, mode = 'inline', className }) => {
  if (!editor) return null;
  return <RunAllWorkflowsButtonBase editor={editor} mode={mode} className={className} />;
};

const RunAllWorkflowsButtonBase: React.FC<{
  editor: Editor;
  mode: RunAllWorkflowsButtonMode;
  className?: string;
}> = ({ editor, mode, className }) => {
  const [running, setRunning] = React.useState(false);
  const [current, setCurrent] = React.useState<{ index: number; total: number } | null>(null);
  const cancelRef = React.useRef(false);

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
      let skippedNoWorkflowId = 0;
      let failedCount = 0;
      const completed = new Set<string>();
      const pending = new Set<string>(workflowIds);

      const markDone = (id: string) => {
        if (!completed.has(id)) {
          completed.add(id);
          pending.delete(id);
          setCurrent({ index: completed.size, total: workflowIds.length });
        }
      };

      // 全局按依赖推进（连接线决定顺序）：只要前置节点完成，后置即可立刻进入可运行队列
      while (!cancelRef.current && pending.size > 0) {
        const runnable: string[] = [];
        for (const id of pending) {
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

        // 若没有可运行节点：可能存在环或异常依赖，跳出让后面的 fallback 来“尽量跑完”
        if (runnable.length === 0) break;

        // 同一批次并行执行，但保持稳定排序（不影响并行，只影响统计/体验）
        runnable.sort((a, b) => compareByYThenX(editor, a, b));

        const tasks: Array<{ id: string }> = [];
        for (const id of runnable) {
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
          tasks.push({ id });
        }

        // 批次级 refreshInputs：先把上游值同步进 inputParams，再并行启动
        for (const t of tasks) {
          try {
            refreshWorkflowInputs(editor, t.id);
          } catch {}
        }

        await Promise.all(
          tasks.map(async (t) => {
            const outputIds = getConnectedOutputIds(editor, t.id);
            const snap = snapshotOutputs(editor, outputIds);
            try {
              await waitForWorkflowFileInputsReady({
                editor,
                workflowShapeId: t.id,
                refreshInputs: () => refreshWorkflowInputs(editor, t.id),
                cancelRef,
              });
              await runWorkflow(editor, t.id, { silent: true, keepPreviousOutputOnFailure: true });
            } catch {
              failedCount += 1;
              restoreOutputs(editor, snap);
            } finally {
              markDone(t.id);
            }
          }),
        );

        await sleep(50);
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
          refreshWorkflowInputs(editor, id);
          // Snapshot current outputs so we can rollback on failure and keep the old result.
          const outputIds = getConnectedOutputIds(editor, id);
          const snap = snapshotOutputs(editor, outputIds);
          try {
            await waitForWorkflowFileInputsReady({
              editor,
              workflowShapeId: id,
              refreshInputs: () => refreshWorkflowInputs(editor, id),
              cancelRef,
            });
            await runWorkflow(editor, id, { silent: true, keepPreviousOutputOnFailure: true });
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
        // 不展示具体报错信息；仅展示统计，帮助判断是否有节点被跳过/失败但已回滚。
        const skipped = skippedNoWorkflowId;
        const suffixParts: string[] = [];
        if (failedCount > 0) suffixParts.push(`失败回滚 ${failedCount}`);
        if (skipped > 0) suffixParts.push(`跳过 ${skipped}`);
        const suffix = suffixParts.length ? `（${suffixParts.join('，')}）` : '';
        toast.success(`已执行完成${suffix}`);
      }
    } catch (e: any) {
      // 不展示具体报错信息
      toast.error('开始运行失败');
    } finally {
      setRunning(false);
      setCurrent(null);
      cancelRef.current = false;
    }
  };

  const button = (
    <Button
      onClick={handleClick}
      variant="outline"
      size="small"
      className={
        className ??
        'pointer-events-auto bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 shadow-sm'
      }
      disabled={false}
      title="按连接线依赖推进：只要前置节点完成，后置即可立刻开始；同一批可并行执行"
    >
      {running ? (current ? `运行中 ${current.index}/${current.total}（点击停止）` : '运行中（点击停止）') : '开始运行'}
    </Button>
  );

  if (mode === 'inline') {
    return button;
  }

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
      {button}
    </div>
  );
};


