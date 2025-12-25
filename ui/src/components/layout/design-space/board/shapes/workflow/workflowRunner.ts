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

    let result: string = '';
    let imageUrl: string = '';
    let imageUrls: string[] = [];
    // 支持多段结果（例如一个 workflow 输出多段文本，分别分发到多个 Output 框）
    let multiSegments: Array<{ text?: string; imageUrl?: string; images?: string[] }> = [];

    const safeJsonStringify = (v: any): string => {
      try {
        return JSON.stringify(v, null, 2);
      } catch {
        try {
          return String(v);
        } catch {
          return '';
        }
      }
    };

    const hasMeaningfulObjectValue = (v: any): boolean => {
      if (!v || typeof v !== 'object') return false;
      if (Array.isArray(v)) return v.length > 0;
      try {
        return Object.keys(v).length > 0;
      } catch {
        return true;
      }
    };

    const isMediaUrl = (url: string): boolean => {
      if (!url || typeof url !== 'string') return false;
      return /\.(png|jpe?g|webp|gif|bmp|svg|mp4|webm|mov|avi)(\?.*)?$/i.test(url);
    };

    // 在任意嵌套结构中查找 output 数组（或其字符串形式）
    const extractOutputArray = (obj: any): any[] | null => {
      if (!obj) return null;

      // 直接就是 [{ type, data }] 形式
      if (Array.isArray(obj) && obj.length > 0 && obj[0] && typeof obj[0] === 'object') {
        const first = obj[0] as any;
        if (typeof first.type === 'string' && 'data' in first) return obj;
      }

      if (typeof obj === 'object') {
        // 1) 直接 output 字段
        if (Array.isArray((obj as any).output)) return (obj as any).output as any[];

        // 2) output 是字符串 JSON
        if (typeof (obj as any).output === 'string') {
          try {
            const parsed = JSON.parse((obj as any).output as string);
            const found = extractOutputArray(parsed);
            if (found) return found;
          } catch {
            // ignore
          }
        }

        // 3) 递归查找
        for (const key in obj) {
          if (!Object.prototype.hasOwnProperty.call(obj, key)) continue;
          const val = (obj as any)[key];
          if (val && (typeof val === 'object' || typeof val === 'string')) {
            const found = extractOutputArray(val);
            if (found) return found;
          }
        }
      }

      // 4) 字符串里夹带 JSON
      if (typeof obj === 'string') {
        const trimmed = obj.trim();
        const start = Math.min(
          ...['{', '['].map((ch) => {
            const idx = trimmed.indexOf(ch);
            return idx === -1 ? Number.MAX_SAFE_INTEGER : idx;
          }),
        );
        const end = Math.max(trimmed.lastIndexOf('}'), trimmed.lastIndexOf(']'));
        if (start !== Number.MAX_SAFE_INTEGER && end > start) {
          const jsonCandidate = trimmed.slice(start, end + 1);
          try {
            const parsed = JSON.parse(jsonCandidate);
            const found = extractOutputArray(parsed);
            if (found) return found;
          } catch {
            // ignore
          }
        }
      }

      return null;
    };

    // 从 Markdown/HTML 文本中尝试提取图片/视频链接（用于多图拆分到多个 Output）
    const extractImageUrlsFromContent = (content: string): string[] => {
      if (!content) return [];
      const urls = new Set<string>();

      // 1) Markdown 图片语法: ![alt](url)
      for (const m of content.matchAll(/!\[[^\]]*]\((https?:\/\/[^\s)]+)\)/gi)) {
        urls.add(m[1]);
      }
      // 2) Markdown 链接（当链接目标是图片/视频时）: [text](url)
      for (const m of content.matchAll(/\[[^\]]*]\((https?:\/\/[^\s)]+)\)/gi)) {
        const u = m[1];
        if (isMediaUrl(u)) urls.add(u);
      }
      // 3) HTML 图片: <img src="url" ...>
      for (const m of content.matchAll(/<img[^>]+src=["'](https?:\/\/[^"']+)["'][^>]*>/gi)) {
        urls.add(m[1]);
      }
      // 4) HTML 视频: <video src="url" ...>
      for (const m of content.matchAll(/<video[^>]+src=["'](https?:\/\/[^"']+)["'][^>]*>/gi)) {
        urls.add(m[1]);
      }
      // 5) 文本中的裸链接（以图片/视频扩展名结尾）
      for (const m of content.matchAll(/https?:\/\/[^\s"'')]+/gi)) {
        const u = m[0];
        if (isMediaUrl(u)) urls.add(u);
      }

      return Array.from(urls);
    };

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

    // 如果能直接从执行结果中解析出 output 数组，优先使用它进行多段分发
    const directOutputArray = extractOutputArray(rawData);

    // 如果 output 是 JSON 字符串（例如 sandbox 返回对象被序列化了），尝试解析
    let data: any = rawData;
    if (typeof data === 'string') {
      try {
        const parsed = JSON.parse(data);
        if (parsed && typeof parsed === 'object') {
          data = parsed;
        }
      } catch {
        // 不是合法 JSON，则按普通字符串处理，后面会走 string 分支
      }
    }

    // 提取结果 - 优先处理 output 数组（格式化后的输出）
    if (data && typeof data === 'object') {
      // 0) 递归查找嵌套结构中的 images 和 text
      const nestedResult = findImagesAndText(data);
      if (nestedResult.images.length > 0) {
        imageUrls.push(...nestedResult.images);
        if (!imageUrl) imageUrl = nestedResult.images[0];
      }
      if (nestedResult.text && !result) {
        result = nestedResult.text;
      }

      // 1) 直接的 images / text 字段
      if (Array.isArray((data as any).images) && (data as any).images.length > 0) {
        imageUrls.push(...(data as any).images.filter((it: any) => typeof it === 'string'));
        if (!imageUrl) imageUrl = (data as any).images[0];
      }
      if ((data as any).text && typeof (data as any).text === 'string' && (data as any).text.trim() && !result) {
        result = (data as any).text;
      }

      // 1.5) output 数组直接包含媒体 URL 的情况
      if (Array.isArray((data as any).output) && (data as any).output.length > 0) {
        const mediaUrls = (data as any).output.filter((item: any) => typeof item === 'string' && isMediaUrl(item));
        if (mediaUrls.length > 0) {
          imageUrls.push(...mediaUrls);
          if (!imageUrl) imageUrl = mediaUrls[0];
        }
      }

      // 2) 尝试解析 output 数组（[{type,data}]）并构造 multiSegments
      const outputArrayFromData = directOutputArray ?? extractOutputArray(data);
      if (outputArrayFromData && outputArrayFromData.length > 0) {
        const outputItems = outputArrayFromData;
        const textParts: string[] = [];

        for (const item of outputItems) {
          const segment: { text?: string; imageUrl?: string; images?: string[] } = {};

          if (item && typeof item === 'object' && (item as any).type === 'image' && (item as any).data) {
            const d = (item as any).data;
            if (typeof d === 'string') {
              imageUrls.push(d);
              if (!imageUrl) imageUrl = d;
              segment.imageUrl = d;
              segment.images = [d];
            }
            const alt = (item as any).alt;
            if (typeof alt === 'string' && alt.trim()) {
              textParts.push(alt.trim());
              segment.text = alt.trim();
            }
          } else if (item && typeof item === 'object' && (item as any).type === 'text' && (item as any).data) {
            const textContent =
              typeof (item as any).data === 'string' ? (item as any).data : safeJsonStringify((item as any).data);
            if (textContent.trim()) {
              textParts.push(textContent.trim());
              segment.text = textContent.trim();
            }
          } else if (item && typeof item === 'object' && (item as any).type === 'json' && (item as any).data) {
            const jsonContent = safeJsonStringify((item as any).data);
            if (jsonContent.trim()) {
              textParts.push(jsonContent.trim());
              segment.text = jsonContent.trim();
            }
          } else if (typeof item === 'string') {
            // 兼容 output: ["url1", "text2"]
            if (isMediaUrl(item)) {
              imageUrls.push(item);
              if (!imageUrl) imageUrl = item;
              segment.imageUrl = item;
              segment.images = [item];
            } else if (item.trim()) {
              textParts.push(item.trim());
              segment.text = item.trim();
            }
          }

          if (segment.text || segment.imageUrl || (segment.images && segment.images.length > 0)) {
            multiSegments.push(segment);
          }
        }

        if (textParts.length > 0) {
          result = textParts.join('\n\n');
        }
      }

      // 3) 兜底从常见字段提取文本
      if (!result) {
        result = (data as any).content || (data as any).result || (data as any).message || (data as any).data || '';
      }

      // 4) 提取单图字段
      const candidate =
        (data as any).imageUrl ||
        (data as any).image_url ||
        (data as any).image ||
        (data as any).imageURL ||
        (data as any).img ||
        (data as any).picture ||
        (data as any).photo ||
        '';
      if (typeof candidate === 'string' && candidate) imageUrls.push(candidate);

      // 5) 兼容 rawOutput（与 WorkflowShapeUtil 一致）
      if ((data as any).rawOutput) {
        const rawOutput = (data as any).rawOutput;
        for (const key in rawOutput) {
          if (key.startsWith('output')) {
            const value = rawOutput[key];
            if (typeof value === 'string' && value.trim()) {
              if (!result) result = value;
            }
          }
        }
        if (!result) {
          result =
            rawOutput.text ||
            rawOutput.content ||
            rawOutput.result ||
            rawOutput.data ||
            rawOutput.message ||
            rawOutput.output ||
            '';
        }
        const candidateImage =
          rawOutput.imageUrl ||
          rawOutput.image_url ||
          rawOutput.image ||
          rawOutput.imageURL ||
          rawOutput.img ||
          rawOutput.picture ||
          rawOutput.photo ||
          '';
        if (typeof candidateImage === 'string' && candidateImage) imageUrls.push(candidateImage);
      }

      // 6) 最后再从 data 对象提取 output* 字段
      if (!result) {
        for (const key in data) {
          if (key.startsWith('output') && typeof (data as any)[key] === 'string' && (data as any)[key].trim()) {
            result = (data as any)[key];
            break;
          }
        }
        if (!result) {
          result = (data as any).text || (data as any).content || (data as any).result || (data as any).data || (data as any).message || '';
        }
      }
    } else if (typeof data === 'string') {
      result = data;
    } else if (data !== null && data !== undefined) {
      // number / boolean 等 primitive 输出
      result = String(data);
    }

    // 额外：从结果文本中提取图片 URL（用于 HTML / Markdown 中内嵌多图的场景）
    if (typeof result === 'string' && result) {
      const urlsFromContent = extractImageUrlsFromContent(result);
      if (urlsFromContent.length > 0) {
        imageUrls.push(...urlsFromContent);
      }
    }

    imageUrls = Array.from(new Set(imageUrls.filter((it) => typeof it === 'string' && it.length > 0)));
    if (!imageUrl && imageUrls.length > 0) imageUrl = imageUrls[0];
    if (result && typeof result !== 'string') result = JSON.stringify(result);

    // 如果没有多段文本，但存在多张图片且有多个 Output，按图片拆分为多段
    if (!multiSegments.length && imageUrls.length > 1 && currentConnectedOutputs.length > 1) {
      multiSegments = imageUrls.map((url) => ({
        imageUrl: url,
        images: [url],
      }));
    }

    // 如果解析不到 text/image，但 data 仍然有“有意义”的结构化内容，则直接展示 JSON，避免误显示“执行完成”
    if (!result && !imageUrl && hasMeaningfulObjectValue(data)) {
      result = safeJsonStringify(data);
    }
    if (!result && !imageUrl) result = `工作流 "${shape.props.workflowName}" 执行完成`;

    const hasMultiSegments = multiSegments.length > 1 && currentConnectedOutputs.length > 1;

    if (hasMultiSegments) {
      currentConnectedOutputs.forEach((outputId, index) => {
        const outputShape = editor.getShape(outputId as any) as any;
        if (!outputShape || outputShape.type !== 'output') return;

        const segment = multiSegments[Math.min(index, multiSegments.length - 1)];
        const segText = segment.text || result || '';
        const segImages =
          (segment.images && segment.images.length > 0
            ? segment.images
            : segment.imageUrl
              ? [segment.imageUrl]
              : imageUrls) || [];
        const segImageUrl = segment.imageUrl || segImages[0] || imageUrl || '';

        editor.updateShape({
          id: outputId as any,
          type: 'output',
          props: {
            ...outputShape.props,
            content: segText,
            imageUrl: segImageUrl,
            images: segImages,
            generatedTime: 0,
          },
        });
      });
    } else {
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
            generatedTime: 0,
          },
        });
      }
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


