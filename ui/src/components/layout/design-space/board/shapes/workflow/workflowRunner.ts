import { Editor } from 'tldraw';

import { vinesHeader } from '@/apis/utils';

import { getShapePortConnections } from '../ports/portConnections';
import { WorkflowShape } from './WorkflowShape.types';

// 形状级别的运行中请求控制器（独立于 React 组件挂载，避免视口裁剪导致“runtime 未注册”）
const workflowAbortControllers = new Map<string, AbortController>();

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

// 使用新的 ConnectionBinding 系统检测连接的 Output（与 WorkflowShapeUtil 保持一致）
export function detectConnectedOutputs(editor: Editor, shapeId: string): string[] {
  const outputs: string[] = [];

  const connections = getShapePortConnections(editor, shapeId as any);
  for (const connection of connections) {
    if (connection.terminal === 'start' && connection.ownPortId === 'output') {
      const connectedShape = editor.getShape(connection.connectedShapeId);
      if (connectedShape?.type === 'output') {
        outputs.push(connection.connectedShapeId as string);
      }
    }
  }

  // Fallback: legacy arrow binding (compat)
  if (outputs.length === 0) {
    const allShapes = editor.getCurrentPageShapes();
    const arrows = allShapes.filter((s) => s.type === 'arrow') as any[];
    arrows.forEach((arrow) => {
      const start = arrow.props?.start as any;
      const end = arrow.props?.end as any;
      if (start?.type === 'binding' && start.boundShapeId === shapeId && end?.type === 'binding') {
        const endShape = editor.getShape(end.boundShapeId);
        if (endShape?.type === 'output') outputs.push(end.boundShapeId);
      }
    });
  }

  // 去重并按位置排序（先 Y 再 X）
  const uniqueOutputs = Array.from(new Set(outputs));
  uniqueOutputs.sort((a, b) => {
    const boundsA = editor.getShapePageBounds(a as any);
    const boundsB = editor.getShapePageBounds(b as any);
    if (!boundsA || !boundsB) return 0;
    const dy = boundsA.y - boundsB.y;
    if (Math.abs(dy) > 2) return dy;
    return boundsA.x - boundsB.x;
  });

  return uniqueOutputs;
}

function normalizeValueByParam(param: any, v: any) {
  const multiple = Boolean(param?.typeOptions?.multipleValues);
  if (multiple) {
    if (Array.isArray(v)) return v.filter(Boolean);
    return v ? [v] : param.value;
  }
  // single value
  if (Array.isArray(v)) return v[0] ?? param.value;
  return v ?? param.value;
}

/**
 * 根据连接关系自动把 Instruction / Output 的值填充到 workflow.inputParams 中
 * 等价于 WorkflowShapeUtil 内部的 detectAndFillInstructionInputs，但不依赖组件挂载。
 */
export function refreshWorkflowInputs(editor: Editor, workflowShapeId: string) {
  const shape = editor.getShape(workflowShapeId as any) as any;
  if (!shape || shape.type !== 'workflow') return;

  const newConnections: Array<{ paramName: string; instructionId?: string; outputId?: string }> = [];
  const connections = getShapePortConnections(editor, workflowShapeId as any);

  for (const connection of connections) {
    if (connection.terminal === 'end') {
      const connectedShape = editor.getShape(connection.connectedShapeId);
      const paramName = String(connection.ownPortId).replace('param_', '');

      if (connectedShape?.type === 'instruction') {
        newConnections.push({ paramName, instructionId: connection.connectedShapeId as string });
      } else if (connectedShape?.type === 'output') {
        newConnections.push({ paramName, outputId: connection.connectedShapeId as string });
      }
    }
  }

  if (newConnections.length === 0) return;

  const updatedParams = (shape.props.inputParams || []).map((param: any) => {
    const connection = newConnections.find((c) => c.paramName === param.name);
    if (!connection) return param;

    if (connection.instructionId) {
      const instructionShape = editor.getShape(connection.instructionId as any) as any;
      if (instructionShape && instructionShape.type === 'instruction') {
        if (instructionShape.props.inputMode === 'image') {
          const v = instructionShape.props.imageUrl || param.value;
          return { ...param, value: normalizeValueByParam(param, v) };
        } else {
          const v = instructionShape.props.content || param.value;
          return { ...param, value: normalizeValueByParam(param, v) };
        }
      }
    } else if (connection.outputId) {
      const outputShape = editor.getShape(connection.outputId as any) as any;
      if (outputShape && outputShape.type === 'output') {
        const hasImages = Array.isArray(outputShape.props.images) && outputShape.props.images.length > 0;
        if (hasImages && param?.typeOptions?.multipleValues) {
          return { ...param, value: normalizeValueByParam(param, outputShape.props.images) };
        }
        if (outputShape.props.imageUrl && String(outputShape.props.imageUrl).trim()) {
          return { ...param, value: normalizeValueByParam(param, outputShape.props.imageUrl) };
        }
        if (outputShape.props.content && String(outputShape.props.content).trim()) {
          return { ...param, value: normalizeValueByParam(param, outputShape.props.content) };
        }
      }
    }

    return param;
  });

  // 兼容旧格式：只存 instruction 连接
  const compatibleConnections = newConnections
    .filter((c) => c.instructionId)
    .map((c) => ({ paramName: c.paramName, instructionId: c.instructionId! }));

  const currentConnectionsStr = JSON.stringify(shape.props.inputConnections || []);
  const newConnectionsStr = JSON.stringify(compatibleConnections);

  if (currentConnectionsStr !== newConnectionsStr || JSON.stringify(updatedParams) !== JSON.stringify(shape.props.inputParams)) {
    editor.updateShape<WorkflowShape>({
      id: shape.id,
      type: 'workflow',
      props: {
        ...shape.props,
        inputParams: updatedParams,
        inputConnections: compatibleConnections,
      },
    });
  }
}

export async function runWorkflow(editor: Editor, workflowShapeId: string, opts?: { silent?: boolean }) {
  const silent = Boolean(opts?.silent);

  const shape = editor.getShape(workflowShapeId as any) as any;
  if (!shape || shape.type !== 'workflow') return;

  if (!shape.props.workflowId || String(shape.props.workflowId).trim() === '') {
    if (!silent) alert('工作流ID为空');
    throw new Error('工作流ID为空');
  }

  // 如果已在运行，则执行"停止"逻辑
  if (shape.props.isRunning) {
    const controller = workflowAbortControllers.get(shape.id as any);
    if (controller) {
      try {
        controller.abort();
      } catch {}
    }
    editor.updateShape<WorkflowShape>({
      id: shape.id,
      type: 'workflow',
      props: { ...shape.props, isRunning: false },
    });
    return;
  }

  // 更新状态为运行中
  editor.updateShape<WorkflowShape>({
    id: shape.id,
    type: 'workflow',
    props: { ...shape.props, isRunning: true },
  });

  try {
    // 实时检测连接的 Output 框
    const currentConnectedOutputs = detectConnectedOutputs(editor, shape.id as any);
    if (currentConnectedOutputs.length === 0) {
      editor.updateShape<WorkflowShape>({
        id: shape.id,
        type: 'workflow',
        props: { ...shape.props, isRunning: false },
      });
      if (!silent) alert('请先连接到 Output 框');
      throw new Error('请先连接到 Output 框');
    }

    // 调用工作流执行 API
    const controller = new AbortController();
    workflowAbortControllers.set(shape.id as any, controller);

    // 刷新一次输入（从连线同步到 inputParams）
    refreshWorkflowInputs(editor, shape.id as any);
    await sleep(20);

    // 构建输入参数对象
    const inputs: Record<string, any> = {};
    (shape.props.inputParams || []).forEach((param: any) => {
      let value: any = param.value;
      const assetType = (param.typeOptions as any)?.assetType;
      if (assetType === 'neural-model' && typeof value === 'string' && value) {
        try {
          value = JSON.parse(value);
        } catch {
          // ignore
        }
      }
      inputs[param.name] = value;
    });

    const startResp = await fetch(`/api/workflow/executions/${shape.props.workflowId}/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...vinesHeader({ useToast: !silent }),
      },
      body: JSON.stringify({ inputData: inputs }),
      signal: controller.signal,
    });

    if (!startResp.ok) {
      throw new Error(`工作流启动失败: ${startResp.status}`);
    }

    const startData = await startResp.json();
    const workflowInstanceId = startData?.data?.workflowInstanceId ?? startData?.workflowInstanceId ?? '';
    if (!workflowInstanceId) throw new Error('无法获取工作流实例 ID');

    // 轮询获取执行结果
    const finishedStatuses = ['COMPLETED', 'FAILED', 'TERMINATED', 'TIMED_OUT', 'CANCELED', 'PAUSED'];
    const maxWaitMs = 10 * 60 * 1000;
    const startAt = Date.now();
    let executionDetail: any = null;

    while (true) {
      try {
        const detailResp = await fetch(`/api/workflow/executions/${workflowInstanceId}`, {
          method: 'GET',
          headers: { ...vinesHeader({ useToast: false }) },
          signal: controller.signal,
        });
        if (detailResp.ok) {
          executionDetail = await detailResp.json();
          const detail = executionDetail?.data ?? executionDetail;
          const status = detail?.status ?? '';
          if (finishedStatuses.includes(status)) {
            executionDetail = detail;
            break;
          }
        }
      } catch (e: any) {
        if (e?.name === 'AbortError') throw e;
      }
      if (Date.now() - startAt >= maxWaitMs) break;
      await sleep(1000);
    }

    if (!executionDetail) return;

    // 解析输出并写回 Output 框（直接复用 WorkflowShapeUtil 的 OutputShape props 结构：content/imageUrl/images/generatedTime）
    let rawData = executionDetail?.output ?? executionDetail;
    if (rawData && typeof rawData === 'object' && 'data' in rawData && !Array.isArray(rawData)) {
      rawData = (rawData as any).data;
    }

    let result = '';
    let imageUrl = '';
    let imageUrls: string[] = [];

    const isMediaUrl = (url: string): boolean => /\.(png|jpe?g|webp|gif|bmp|svg|mp4|webm|mov|avi)(\?.*)?$/i.test(url);
    const findImagesAndText = (obj: any): { images: string[]; text: string } => {
      const found: { images: string[]; text: string } = { images: [], text: '' };
      if (!obj || typeof obj !== 'object') return found;
      if (Array.isArray((obj as any).images) && (obj as any).images.length > 0) {
        found.images.push(...(obj as any).images.filter((it: any) => typeof it === 'string'));
      }
      if ((obj as any).text && typeof (obj as any).text === 'string' && (obj as any).text.trim()) {
        found.text = (obj as any).text;
      }
      for (const key in obj) {
        if (key === 'images' || key === 'text') continue;
        const value = (obj as any)[key];
        if (Array.isArray(value)) {
          for (const item of value) {
            if (item && typeof item === 'object') {
              const nested = findImagesAndText(item);
              if (nested.images.length > 0) found.images.push(...nested.images);
              if (nested.text && !found.text) found.text = nested.text;
            }
          }
        } else if (value && typeof value === 'object') {
          const nested = findImagesAndText(value);
          if (nested.images.length > 0) found.images.push(...nested.images);
          if (nested.text && !found.text) found.text = nested.text;
        }
      }
      return found;
    };

    let data: any = rawData;
    if (typeof data === 'string') {
      try {
        data = JSON.parse(data);
      } catch {
        // ignore
      }
    }

    if (data && typeof data === 'object') {
      const nested = findImagesAndText(data);
      if (nested.images.length > 0) {
        imageUrls.push(...nested.images);
        if (!imageUrl) imageUrl = nested.images[0];
      }
      if (nested.text && !result) result = nested.text;

      if (Array.isArray((data as any).images) && (data as any).images.length > 0) {
        imageUrls.push(...(data as any).images.filter((it: any) => typeof it === 'string'));
        if (!imageUrl) imageUrl = (data as any).images[0];
      }
      if ((data as any).text && typeof (data as any).text === 'string' && (data as any).text.trim() && !result) {
        result = (data as any).text;
      }

      if (Array.isArray((data as any).output) && (data as any).output.length > 0) {
        const mediaUrls = (data as any).output.filter((item: any) => typeof item === 'string' && isMediaUrl(item));
        if (mediaUrls.length > 0) {
          imageUrls.push(...mediaUrls);
          if (!imageUrl) imageUrl = mediaUrls[0];
        }
      }

      if (!result) {
        result = (data as any).content || (data as any).result || (data as any).message || '';
      }
      const candidate =
        (data as any).imageUrl ||
        (data as any).image_url ||
        (data as any).image ||
        (data as any).imageURL ||
        (data as any).img ||
        '';
      if (typeof candidate === 'string' && candidate) imageUrls.push(candidate);
    } else if (typeof data === 'string') {
      result = data;
    }

    imageUrls = Array.from(new Set(imageUrls.filter((it) => typeof it === 'string' && it.length > 0)));
    if (!imageUrl && imageUrls.length > 0) imageUrl = imageUrls[0];
    if (result && typeof result !== 'string') result = JSON.stringify(result);
    if (!result && !imageUrl) result = `工作流 "${shape.props.workflowName}" 执行完成`;

    for (const outputId of currentConnectedOutputs) {
      const outputShape = editor.getShape(outputId as any) as any;
      if (!outputShape || outputShape.type !== 'output') continue;
      editor.updateShape({
        id: outputId as any,
        type: 'output',
        props: {
          ...outputShape.props,
          content: result,
          imageUrl,
          images: imageUrls,
        },
      });
    }
  } finally {
    editor.updateShape<WorkflowShape>({
      id: shape.id,
      type: 'workflow',
      props: { ...shape.props, isRunning: false },
    });
    workflowAbortControllers.delete(shape.id as any);
  }
}


