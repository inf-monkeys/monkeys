import React from 'react';

import { BaseBoxShapeUtil, Circle2d, Editor, Group2d, HTMLContainer, Rectangle2d, resizeBox } from 'tldraw';

import { IMediaData } from '@/apis/media-data/typings';
import { useUgcMediaData } from '@/apis/ugc';
import { IAssetItem } from '@/apis/ugc/typings';
import { vinesHeader } from '@/apis/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.tsx';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { VinesIcon } from '@/components/ui/vines-icon';
import { VinesUploader } from '@/components/ui/vines-uploader';
import { DEFAULT_ASSET_ICON_URL } from '@/consts/icons.ts';
import { getI18nContent } from '@/utils';

import { GenericPort } from '../ports/GenericPort';
import { getShapePortConnections } from '../ports/portConnections';
import { getWorkflowPorts } from '../ports/shapePorts';
import { WorkflowInputParam, WorkflowShape } from './WorkflowShape.types';
import { registerWorkflowRuntime, unregisterWorkflowRuntime } from './workflowRuntimeRegistry';

const PORT_RADIUS_PX = 8;

// 形状级别的运行中请求控制器
const workflowAbortControllers = new Map<string, AbortController>();

type NeuralModelAsset = IAssetItem<IMediaData>;

function WorkflowNeuralModelField({
  param,
  onChange,
}: {
  param: WorkflowInputParam;
  onChange: (value: any) => void;
}) {
  const {
    data: mediaData,
    isLoading,
  } = useUgcMediaData(
    {
      page: 1,
      limit: 100,
      search: (param.typeOptions as any)?.search || '',
    },
    'only',
  );

  const [isLoadingContent, setIsLoadingContent] = React.useState(false);
  const [selectedAssetId, setSelectedAssetId] = React.useState<string | null>(null);

  const neuralModels = (mediaData?.data ?? []) as NeuralModelAsset[];

  const hasValue = param.value !== undefined && param.value !== null && param.value !== '';
  const displayValue = selectedAssetId || (hasValue ? '__has_value__' : undefined);

  const handleValueChange = React.useCallback(
    async (assetId: string) => {
      if (!assetId || assetId === ' ') {
        // 对于 tldraw shape props，不能写入 undefined，否则会触发
        // “Expected json serializable value, got undefined” 校验错误。
        // 这里用空字符串表示“未选择模型”，和其他字符串输入保持一致。
        onChange('');
        setSelectedAssetId(null);
        return;
      }

      setSelectedAssetId(assetId);
      setIsLoadingContent(true);

      try {
        const selectedAsset = neuralModels.find((item) => item.id === assetId);
        if (!selectedAsset?.url) {
          throw new Error('Asset URL not found');
        }

        const response = await fetch(selectedAsset.url);
        if (!response.ok) {
          throw new Error('Failed to fetch JSON content');
        }

        const jsonText = await response.text();

        let jsonContent: any;
        try {
          jsonContent = JSON.parse(jsonText);
        } catch {
          jsonContent = jsonText;
        }

        const jsonString = typeof jsonContent === 'string' ? jsonContent : JSON.stringify(jsonContent);
        onChange(jsonString);
      } catch (error) {
        console.error('Failed to load neural model content:', error);
        onChange('');
        setSelectedAssetId(null);
      } finally {
        setIsLoadingContent(false);
      }
    },
    [neuralModels, onChange],
  );

  if (isLoading || isLoadingContent) {
    return (
      <div
        style={{
          width: '100%',
          padding: '4px 8px',
          fontSize: '11px',
          color: '#6B7280',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        正在加载神经模型...
      </div>
    );
  }

  const hasModels = neuralModels.length > 0;

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      style={{ pointerEvents: 'auto' }}
    >
      <Select onValueChange={handleValueChange} value={displayValue}>
        <SelectTrigger className="h-7 w-full px-2 py-1 text-xs">
          <SelectValue placeholder={hasValue && !selectedAssetId ? '已选择神经模型（JSON内容）' : '请选择神经模型'} />
        </SelectTrigger>
        <SelectContent className="max-h-60">
          {hasValue && !selectedAssetId && (
            <SelectItem value="__has_value__" disabled>
              当前值：JSON内容（请重新选择以更改）
            </SelectItem>
          )}
          <SelectItem value=" ">不使用模型</SelectItem>
          {!hasModels && (
            <SelectItem value="__empty__" disabled>
              暂无神经模型，请先在设计资产中创建
            </SelectItem>
          )}
          {neuralModels.map((asset) => {
            const displayName = getI18nContent(asset.displayName || asset.name);
            const description = getI18nContent(asset.description);
            const iconUrl = asset.iconUrl || DEFAULT_ASSET_ICON_URL;

            return (
              <Tooltip key={asset.id}>
                <TooltipTrigger asChild>
                  <SelectItem value={asset.id}>
                    <div className="flex w-full items-center gap-2">
                      <VinesIcon src={iconUrl} size="xs" />
                      <div className="flex-1">
                        <p className="break-all text-sm font-bold leading-4">{displayName}</p>
                        {description && (
                          <p className="line-clamp-1 break-all text-xs text-muted-foreground">{description}</p>
                        )}
                      </div>
                    </div>
                  </SelectItem>
                </TooltipTrigger>
                {description && <TooltipContent>{description}</TooltipContent>}
              </Tooltip>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
}

export class WorkflowShapeUtil extends BaseBoxShapeUtil<WorkflowShape> {
  static override type = 'workflow' as const;

  override isAspectRatioLocked = (_shape: WorkflowShape) => false;
  override canResize = (_shape: WorkflowShape) => true;
  override canBind = () => true;

  getDefaultProps(): WorkflowShape['props'] {
    return {
      w: 300,
      h: 200,
      workflowId: '',
      workflowName: '',
      workflowDescription: '',
      color: 'violet',
      isRunning: false,
      connections: [],
      inputParams: [],
      inputConnections: [],
      generatedTime: 0,
    };
  }

  override onResize = (shape: WorkflowShape, info: any) => {
    return resizeBox(shape, info);
  };

  // Define geometry including ports
  getGeometry(shape: WorkflowShape) {
    const ports = getWorkflowPorts(this.editor, shape);

    const portGeometries = Object.values(ports).map(
      (port) =>
        new Circle2d({
          x: port.x - PORT_RADIUS_PX,
          y: port.y - PORT_RADIUS_PX,
          radius: PORT_RADIUS_PX,
          isFilled: true,
          isLabel: true,
          excludeFromShapeBounds: true,
        }),
    );

    // Ensure valid dimensions
    const width = Math.max(shape.props.w || 300, 1);
    const height = Math.max(shape.props.h || 200, 1);

    const bodyGeometry = new Rectangle2d({
      width,
      height,
      isFilled: true,
    });

    return new Group2d({
      children: [bodyGeometry, ...portGeometries],
    });
  }

  component(shape: WorkflowShape) {
    const bounds = this.editor.getShapeGeometry(shape).bounds;

    return (
      <HTMLContainer
        id={shape.id}
        style={{
          width: bounds.width,
          height: bounds.height,
          pointerEvents: 'all',
          userSelect: 'none',
        }}
      >
        <WorkflowShapeComponent shape={shape} editor={this.editor} />
      </HTMLContainer>
    );
  }

  indicator(shape: WorkflowShape) {
    const ports = Object.values(getWorkflowPorts(this.editor, shape));
    return (
      <>
        <rect width={shape.props.w} height={shape.props.h} />
        {ports.map((port) => (
          <circle key={port.id} cx={port.x} cy={port.y} r={PORT_RADIUS_PX} />
        ))}
      </>
    );
  }
}

function WorkflowShapeComponent({ shape, editor }: { shape: WorkflowShape; editor: Editor }) {
  // 获取参数连接点的引用
  const paramConnectionRefs = React.useRef<Map<string, HTMLDivElement>>(new Map());

  // 使用新的 ConnectionBinding 系统检测连接的 Instruction 或 Output 并自动填充参数
  const detectAndFillInstructionInputs = () => {
    const newConnections: Array<{ paramName: string; instructionId?: string; outputId?: string }> = [];

    // 使用新的端口连接系统
    const connections = getShapePortConnections(editor, shape.id);

    for (const connection of connections) {
      // 查找连接到 Workflow 输入端口的连接（terminal === 'end'）
      if (connection.terminal === 'end') {
        const connectedShape = editor.getShape(connection.connectedShapeId);

        // 从端口 ID 中提取参数名称 (格式: "param_xxx")
        const paramName = connection.ownPortId.replace('param_', '');

        // 检查是否连接到 Instruction
        if (connectedShape?.type === 'instruction') {
          newConnections.push({
            paramName,
            instructionId: connection.connectedShapeId as string,
          });
        }
        // 检查是否连接到 Output
        else if (connectedShape?.type === 'output') {
          newConnections.push({
            paramName,
            outputId: connection.connectedShapeId as string,
          });
        }
      }
    }

    // 如果没有找到新连接，回退检查旧的箭头连接（兼容性）
    if (newConnections.length === 0) {
      const allShapes = editor.getCurrentPageShapes();
      const arrows = allShapes.filter((s) => s.type === 'arrow') as any[];
      const selfBounds = editor.getShapePageBounds(shape.id as any);

      if (!selfBounds) return;

      const isPointInRect = (p: { x: number; y: number }, r: { x: number; y: number; w: number; h: number }) =>
        p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h;
      const expandRect = (r: { x: number; y: number; w: number; h: number }, padding = 16) => ({
        x: r.x - padding,
        y: r.y - padding,
        w: r.w + padding * 2,
        h: r.h + padding * 2,
      });

      arrows.forEach((arrow) => {
        const start = arrow.props.start as any;
        const end = arrow.props.end as any;

        // 检查箭头是否从Instruction指向本Workflow
        if (start?.type === 'binding' && end?.type === 'binding' && end.boundShapeId === shape.id) {
          const startShape = editor.getShape(start.boundShapeId) as any;
          if (startShape?.type === 'instruction') {
            // 使用第一个参数作为默认映射
            if (shape.props.inputParams.length > 0) {
              const firstParam = shape.props.inputParams[0];
              newConnections.push({
                paramName: firstParam.name,
                instructionId: startShape.id,
              });
            }
          }
        } else {
          // 精确判定：检查箭头终点是否在某个参数连接点附近
          const endAbs = { x: arrow.x + (end?.x ?? 0), y: arrow.y + (end?.y ?? 0) };
          const startAbs = { x: arrow.x + (start?.x ?? 0), y: arrow.y + (start?.y ?? 0) };

          // 遍历所有参数的连接点
          shape.props.inputParams.forEach((param) => {
            const paramRef = paramConnectionRefs.current.get(param.name);
            if (!paramRef) return;

            const paramRect = paramRef.getBoundingClientRect();
            const editorRect = editor.getContainer().getBoundingClientRect();

            // 转换为画布坐标
            const camera = editor.getCamera();
            const paramPageX = (paramRect.left - editorRect.left) / camera.z - camera.x;
            const paramPageY = (paramRect.top - editorRect.top) / camera.z - camera.y;

            const paramBounds = {
              x: paramPageX,
              y: paramPageY,
              w: paramRect.width / camera.z,
              h: paramRect.height / camera.z,
            };

            // 检查箭头终点是否在这个参数连接点附近
            if (isPointInRect(endAbs, expandRect(paramBounds))) {
              // 检查起点是否是Instruction
              for (const s of allShapes) {
                if (s.type !== 'instruction') continue;
                const b = editor.getShapePageBounds(s.id as any);
                if (!b) continue;
                if (isPointInRect(startAbs, expandRect(b))) {
                  newConnections.push({
                    paramName: param.name,
                    instructionId: s.id as string,
                  });
                }
              }
            }
          });
        }
      });
    }

    const normalizeValueByParam = (param: any, v: any) => {
      const multiple = Boolean(param?.typeOptions?.multipleValues);
      if (multiple) {
        if (Array.isArray(v)) return v.filter(Boolean);
        return v ? [v] : param.value;
      }
      // single value
      if (Array.isArray(v)) return v[0] ?? param.value;
      return v ?? param.value;
    };

    // 填充参数值
    if (newConnections.length > 0) {
      const updatedParams = shape.props.inputParams.map((param) => {
        const connection = newConnections.find((c) => c.paramName === param.name);
        if (connection) {
          // 如果连接到 Instruction
          if (connection.instructionId) {
            const instructionShape = editor.getShape(connection.instructionId as any) as any;
            if (instructionShape && instructionShape.type === 'instruction') {
              // 根据Instruction的输入模式获取值
              if (instructionShape.props.inputMode === 'image') {
                const v = instructionShape.props.imageUrl || param.value;
                return { ...param, value: normalizeValueByParam(param, v) };
              } else {
                const v = instructionShape.props.content || param.value;
                return { ...param, value: normalizeValueByParam(param, v) };
              }
            }
          }
        // 如果连接到 Output
        else if (connection.outputId) {
          const outputShape = editor.getShape(connection.outputId as any) as any;
          if (outputShape && outputShape.type === 'output') {
            // 优先使用图片，如果没有图片则使用文本内容
            const hasImages = Array.isArray(outputShape.props.images) && outputShape.props.images.length > 0;
            if (hasImages && param?.typeOptions?.multipleValues) {
              return { ...param, value: normalizeValueByParam(param, outputShape.props.images) };
            }
            if (outputShape.props.imageUrl && outputShape.props.imageUrl.trim()) {
              return { ...param, value: normalizeValueByParam(param, outputShape.props.imageUrl) };
            } else if (outputShape.props.content && outputShape.props.content.trim()) {
              return { ...param, value: normalizeValueByParam(param, outputShape.props.content) };
            }
          }
        }
        }
        return param;
      });

      // 更新inputConnections（转换为兼容格式）
      const compatibleConnections = newConnections
        .filter((c) => c.instructionId) // 只保留有 instructionId 的连接（兼容旧格式）
        .map((c) => ({
          paramName: c.paramName,
          instructionId: c.instructionId!,
        }));

      const currentConnectionsStr = JSON.stringify(shape.props.inputConnections || []);
      const newConnectionsStr = JSON.stringify(compatibleConnections);

      if (
        currentConnectionsStr !== newConnectionsStr ||
        JSON.stringify(updatedParams) !== JSON.stringify(shape.props.inputParams)
      ) {
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
  };

  // 定期检测连接（可以优化为事件驱动）
  React.useEffect(() => {
    const interval = setInterval(() => {
      detectAndFillInstructionInputs();
    }, 500);
    return () => clearInterval(interval);
  }, [shape.id, shape.props.inputParams, shape.props.inputConnections]);

  const handleParamChange = (paramName: string, value: any) => {
    const updatedParams = shape.props.inputParams.map((param) =>
      param.name === paramName ? { ...param, value } : param,
    );
    editor.updateShape<WorkflowShape>({
      id: shape.id,
      type: 'workflow',
      props: {
        ...shape.props,
        inputParams: updatedParams,
      },
    });
  };

  // 使用新的 ConnectionBinding 系统检测连接的 Output
  const detectConnectedOutputs = (): string[] => {
    const outputs: string[] = [];

    // 使用新的端口连接系统
    const connections = getShapePortConnections(editor, shape.id);

    for (const connection of connections) {
      // 查找从 Workflow 的 output 端口出发的连接（terminal === 'start'）
      if (connection.terminal === 'start' && connection.ownPortId === 'output') {
        const connectedShape = editor.getShape(connection.connectedShapeId);
        if (connectedShape?.type === 'output') {
          outputs.push(connection.connectedShapeId as string);
        }
      }
    }

    // 如果没有找到新连接，回退检查旧的箭头连接（兼容性）
    if (outputs.length === 0) {
      const allShapes = editor.getCurrentPageShapes();
      const arrows = allShapes.filter((s) => s.type === 'arrow') as any[];

      arrows.forEach((arrow) => {
        const start = arrow.props.start as any;
        const end = arrow.props.end as any;

        if (start?.type === 'binding' && start.boundShapeId === shape.id && end?.type === 'binding') {
          const endShape = editor.getShape(end.boundShapeId);
          if (endShape?.type === 'output') {
            outputs.push(end.boundShapeId);
          }
        }
      });
    }

    // 去重后按画布中的位置排序（先按 Y 从上到下，再按 X 从左到右）
    const uniqueOutputs = Array.from(new Set(outputs));

    uniqueOutputs.sort((a, b) => {
      const boundsA = editor.getShapePageBounds(a as any);
      const boundsB = editor.getShapePageBounds(b as any);

      if (!boundsA || !boundsB) return 0;

      const dy = boundsA.y - boundsB.y;
      if (Math.abs(dy) > 2) {
        return dy;
      }

      return boundsA.x - boundsB.x;
    });

    return uniqueOutputs;
  };

  const handleRun = async (opts?: { silent?: boolean }) => {
    console.log('[Workflow] 播放按钮被点击', {
      shapeId: shape.id,
      workflowId: shape.props.workflowId,
      workflowName: shape.props.workflowName,
      connections: shape.props.connections,
    });
    const silent = Boolean(opts?.silent);

    if (!shape.props.workflowId || shape.props.workflowId.trim() === '') {
      console.warn('[Workflow] 工作流ID为空，取消执行');
      if (!silent) {
        alert('工作流ID为空');
        return;
      }
      throw new Error('工作流ID为空');
    }

    if (!shape.props.connections || shape.props.connections.length === 0) {
      const detected = detectConnectedOutputs();

      if (detected.length === 0) {
        console.warn('[Workflow] 没有连接的 Output 框');
        if (!silent) {
          alert('请先连接到 Output 框');
          return;
        }
        throw new Error('请先连接到 Output 框');
      }
      // 同步存储 connections
      try {
        editor.updateShape<WorkflowShape>({
          id: shape.id,
          type: 'workflow',
          props: { ...shape.props, connections: detected },
        });
      } catch {}
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
      console.log('[Workflow] 已请求停止');
      return;
    }

    // 更新状态为运行中
    editor.updateShape<WorkflowShape>({
      id: shape.id,
      type: 'workflow',
      props: {
        ...shape.props,
        isRunning: true,
      },
    });

    try {
      console.log('[Workflow] 开始执行工作流...');

      // 实时检测连接的Output框
      const currentConnectedOutputs = detectConnectedOutputs();
      console.log('[Workflow] 当前连接的 Output 框:', currentConnectedOutputs);

      if (currentConnectedOutputs.length === 0) {
        console.warn('[Workflow] 没有连接的 Output 框');
        editor.updateShape<WorkflowShape>({
          id: shape.id,
          type: 'workflow',
          props: { ...shape.props, isRunning: false },
        });
        if (!silent) {
          alert('请先连接到 Output 框');
          return;
        }
        throw new Error('请先连接到 Output 框');
      }

      // 调用工作流执行API
      const controller = new AbortController();
      workflowAbortControllers.set(shape.id as any, controller);

      // 构建输入参数对象
      const inputs: Record<string, any> = {};
      shape.props.inputParams.forEach((param) => {
        let value: any = param.value;

        // 与表单提交流程对齐：神经模型字段在提交前需要把 JSON 字符串解析为对象
        // 参考：workspace/vines-view/form/tabular/render/index.tsx 中的处理逻辑
        const assetType = (param.typeOptions as any)?.assetType;
        if (assetType === 'neural-model' && typeof value === 'string' && value) {
          try {
            value = JSON.parse(value);
          } catch (e) {
            console.warn('[Workflow] Failed to parse neural model JSON for param', param.name, value, e);
          }
        }

        inputs[param.name] = value;
      });

      console.log('[Workflow] 执行参数:', inputs);

      // 异步启动工作流（不等待完成）
      const startResp = await fetch(`/api/workflow/executions/${shape.props.workflowId}/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // silent 模式下不展示任何错误 toast，交由外层（如“从头运行”）回滚并继续推进
          ...vinesHeader({ useToast: !silent }),
        },
        body: JSON.stringify({
          inputData: inputs,
          // 不再同步等待结果，避免 504
        }),
        signal: controller.signal,
      });

      if (!startResp.ok) {
        throw new Error(`工作流启动失败: ${startResp.status}`);
      }

      const startData = await startResp.json();
      const workflowInstanceId = startData?.data?.workflowInstanceId ?? startData?.workflowInstanceId ?? '';
      if (!workflowInstanceId) {
        throw new Error('无法获取工作流实例 ID');
      }
      console.log('[Workflow] 已启动实例：', workflowInstanceId);

      // 轮询获取执行结果
      const finishedStatuses = ['COMPLETED', 'FAILED', 'TERMINATED', 'TIMED_OUT', 'CANCELED', 'PAUSED'];
      const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
      const maxWaitMs = 10 * 60 * 1000; // 与后端默认上限保持一致
      const startAt = Date.now();

      let executionDetail: any = null;
      // 首次立即拉取一次
      while (true) {
        try {
          const detailResp = await fetch(`/api/workflow/executions/${workflowInstanceId}`, {
            method: 'GET',
            headers: {
              ...vinesHeader({ useToast: false }),
            },
            signal: controller.signal,
          });
          if (detailResp.ok) {
            executionDetail = await detailResp.json();
            // vinesFetcher 风格通常包装 { data }, 但这里直接防御两种
            const detail = executionDetail?.data ?? executionDetail;
            const status = detail?.status ?? '';
            if (finishedStatuses.includes(status)) {
              executionDetail = detail;
              break;
            }
          } else {
            console.warn('[Workflow] 获取执行详情失败: ', detailResp.status);
          }
        } catch (e: any) {
          if (e?.name === 'AbortError') {
            console.log('[Workflow] 轮询已中断');
            throw e;
          }
          console.warn('[Workflow] 轮询异常，稍后重试: ', e);
        }
        if (Date.now() - startAt >= maxWaitMs) {
          console.warn('[Workflow] 轮询超时');
          break;
        }
        await sleep(1000);
      }

      // 如果没有拿到详情，给出简要提示并结束
      if (!executionDetail) {
        console.warn('[Workflow] 未能获取到执行详情');
        return;
      }

      // 通过 API 获取 workflow 的最新执行记录来计算耗时
      let generatedTime = 0;
      
      try {
        // 调用 API 获取最新的执行记录
        const historyResp = await fetch(
          `/api/workflow/executions/${shape.props.workflowId}/outputs?page=1&limit=1`,
          {
            method: 'GET',
            headers: {
              ...vinesHeader({ useToast: false }),
            },
          },
        );
        
        if (historyResp.ok) {
          const historyData = await historyResp.json();
          console.log('[Workflow] 获取到历史执行记录:', historyData);
          
          // 解析最新的执行记录
          const latestExecution = historyData?.data?.[0] || historyData?.[0];
          
          if (latestExecution) {
            let startTime = latestExecution.startTime || 0;
            let endTime = latestExecution.endTime || 0;
            
            // 如果是秒级时间戳（10位），转换为毫秒
            if (startTime > 0 && String(startTime).length === 10) {
              startTime *= 1000;
            }
            if (endTime > 0 && String(endTime).length === 10) {
              endTime *= 1000;
            }
            
            // 计算耗时（毫秒）- 只有当两个时间都有效时才计算
            if (endTime && startTime && endTime > startTime) {
              generatedTime = endTime - startTime;
              
              console.log('[Workflow] 从历史记录计算生成耗时:', {
                instanceId: latestExecution.instanceId,
                startTime: new Date(startTime).toISOString(),
                endTime: new Date(endTime).toISOString(),
                duration: generatedTime,
                durationFormatted:
                  generatedTime < 1000 ? `${generatedTime}ms` : `${(generatedTime / 1000).toFixed(2)}s`,
              });
            } else {
              console.warn('[Workflow] 时间数据不完整，无法计算耗时:', { startTime, endTime });
            }
          } else {
            console.warn('[Workflow] 未找到历史执行记录');
          }
        } else {
          console.warn('[Workflow] 获取历史执行记录失败:', historyResp.status);
        }
      } catch (error) {
        console.error('[Workflow] 获取历史执行记录异常:', error);
      }

      // 提取可展示的数据（优先使用 output）
      // executionDetail.output 可能是 {data: ..., requestId: ...} 的格式，需要提取 data
      let rawData = executionDetail?.output ?? executionDetail;
      
      // 如果 output 是对象且包含 data 字段，使用 data
      if (rawData && typeof rawData === 'object' && 'data' in rawData && !Array.isArray(rawData)) {
        console.log('[Workflow] 检测到 output 包含 data 字段，提取 data');
        rawData = (rawData as any).data;
      }
      
      let result: string = '';
      let imageUrl: string = '';
      let imageUrls: string[] = [];
      // 支持多段结果（例如一个 workflow 输出多段文本，分别分发到多个 Output 框）
      let multiSegments: Array<{ text?: string; imageUrl?: string; images?: string[] }> = [];

      console.log('[Workflow] 执行完成，准备提取展示结果');
      console.log('[Workflow] 最终 rawData:', {
        type: typeof rawData,
        isArray: Array.isArray(rawData),
        value: rawData,
        keys: rawData && typeof rawData === 'object' ? Object.keys(rawData) : null,
      });

      // 辅助函数：在任意嵌套结构中查找 output 数组（或其字符串形式）
      const extractOutputArray = (obj: any): any[] | null => {
        if (!obj) return null;

        // 如果本身就是数组且长得像 [{ type, data }]
        if (Array.isArray(obj) && obj.length > 0 && obj[0] && typeof obj[0] === 'object') {
          const first = obj[0] as any;
          if (typeof first.type === 'string' && 'data' in first) {
            return obj;
          }
        }

        // 如果是对象
        if (typeof obj === 'object') {
          // 1) 直接的 output 字段
          if (Array.isArray((obj as any).output)) {
            return (obj as any).output as any[];
          }

          // 2) output 是字符串形式的 JSON
          if (typeof (obj as any).output === 'string') {
            const str = (obj as any).output as string;
            try {
              const parsed = JSON.parse(str);
              const fromParsed = extractOutputArray(parsed);
              if (fromParsed) return fromParsed;
            } catch {
              // ignore
            }
          }

          // 3) 在所有字段中递归查找
          for (const key in obj) {
            if (!Object.prototype.hasOwnProperty.call(obj, key)) continue;
            const val = (obj as any)[key];
            if (val && (typeof val === 'object' || typeof val === 'string')) {
              const found = extractOutputArray(val);
              if (found) return found;
            }
          }
        }

        // 如果是字符串，尝试直接解析
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
              const fromParsed = extractOutputArray(parsed);
              if (fromParsed) return fromParsed;
            } catch {
              // ignore
            }
          }
        }

        return null;
      };

      // 辅助函数：递归查找嵌套对象中的 images 和 text
      const findImagesAndText = (obj: any): { images: string[]; text: string } => {
        const found: { images: string[]; text: string } = { images: [], text: '' };

        if (!obj || typeof obj !== 'object') return found;

        // 检查当前层级的 images 和 text
        if (Array.isArray((obj as any).images) && (obj as any).images.length > 0) {
          found.images.push(...(obj as any).images.filter((it: any) => typeof it === 'string'));
        }
        if ((obj as any).text && typeof (obj as any).text === 'string' && (obj as any).text.trim()) {
          found.text = (obj as any).text;
        }

        // 递归查找嵌套对象和数组
        for (const key in obj) {
          if (key === 'images' || key === 'text') continue; // 已经处理过了

          const value = (obj as any)[key];
          if (Array.isArray(value)) {
            // 如果是数组，遍历每个元素
            for (const item of value) {
              if (item && typeof item === 'object') {
                const nested = findImagesAndText(item);
                if (nested.images.length > 0) found.images.push(...nested.images);
                if (nested.text && !found.text) found.text = nested.text;
              }
            }
          } else if (value && typeof value === 'object') {
            // 如果是对象，递归查找
            const nested = findImagesAndText(value);
            if (nested.images.length > 0) found.images.push(...nested.images);
            if (nested.text && !found.text) found.text = nested.text;
          }
        }

        return found;
      };

      // 辅助函数：检查 URL 是否是图片或视频
      const isMediaUrl = (url: string): boolean => {
        if (!url || typeof url !== 'string') return false;
        return /\.(png|jpe?g|webp|gif|bmp|svg|mp4|webm|mov|avi)(\?.*)?$/i.test(url);
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
        console.log('[Workflow] 开始解析数据:', {
          hasOutput: 'output' in data,
          outputType: Array.isArray(data.output) ? 'array' : typeof data.output,
          outputValue: data.output,
          dataKeys: Object.keys(data),
        });

        // 0. 首先尝试递归查找嵌套结构中的 images 和 text（处理复杂的嵌套响应）
        const nestedResult = findImagesAndText(data);
        if (nestedResult.images.length > 0) {
          imageUrls.push(...nestedResult.images);
          if (!imageUrl) imageUrl = nestedResult.images[0]; // 取第一张图片
        }
        if (nestedResult.text && !result) {
          result = nestedResult.text;
        }

        // 1. 优先处理直接返回的 images 和 text 字段（某些工作流 API 的直接格式）
        if (Array.isArray(data.images) && data.images.length > 0) {
          imageUrls.push(...data.images.filter((it: any) => typeof it === 'string'));
          if (!imageUrl) imageUrl = data.images[0]; // 取第一张图片
        }
        if (data.text && typeof data.text === 'string' && data.text.trim() && !result) {
          result = data.text;
        }

        // 1.5. 处理 output 数组直接包含图片/视频 URL 的情况
        // 例如: {"output": ["https://...mp4"]} 或 {"output": ["url1", "url2"]}
        if (Array.isArray(data.output) && data.output.length > 0) {
          console.log('[Workflow] 检测到 output 数组:', data.output);
          const mediaUrls = data.output.filter((item: any) => {
            const isMedia = typeof item === 'string' && isMediaUrl(item);
            console.log('[Workflow] 检查项:', { item, isString: typeof item === 'string', isMedia });
            return isMedia;
          });
          if (mediaUrls.length > 0) {
            imageUrls.push(...mediaUrls);
            if (!imageUrl) imageUrl = mediaUrls[0];
            console.log('[Workflow] 从 output 数组中提取到媒体文件:', mediaUrls);
          } else {
            console.warn('[Workflow] output 数组中没有找到媒体文件');
          }
        }

        // 2. 如果能够解析到 output 数组（格式化后的输出）
        const outputArrayFromData = directOutputArray ?? extractOutputArray(data);

        if (outputArrayFromData && outputArrayFromData.length > 0) {
          const outputItems = outputArrayFromData;
          const textParts: string[] = [];
          // 提取文本和图片
          for (const item of outputItems) {
            const segment: { text?: string; imageUrl?: string; images?: string[] } = {};
            if (item.type === 'image' && item.data) {
              // 支持多图
              if (typeof item.data === 'string') imageUrls.push(item.data);
              if (!imageUrl && typeof item.data === 'string') imageUrl = item.data;
              if (typeof item.data === 'string') {
                segment.imageUrl = item.data;
                segment.images = [item.data];
              }
              // 如果图片有 alt 文本，也添加到文本结果中
              if (item.alt && typeof item.alt === 'string' && item.alt.trim()) {
                textParts.push(item.alt);
                if (item.alt.trim()) {
                  segment.text = item.alt.trim();
                }
              }
            } else if (item.type === 'text' && item.data) {
              const textContent = typeof item.data === 'string' ? item.data : JSON.stringify(item.data);
              if (textContent.trim()) {
                textParts.push(textContent);
                segment.text = textContent.trim();
              }
            } else if (item.type === 'json' && item.data) {
              const jsonContent = JSON.stringify(item.data, null, 2);
              if (jsonContent.trim()) {
                textParts.push(jsonContent);
                segment.text = jsonContent.trim();
              }
            }

            // 记录每一段，用于多 Output 分发
            if (segment.text || segment.imageUrl || (segment.images && segment.images.length > 0)) {
              multiSegments.push(segment);
            }
          }
          // 合并所有文本部分
          if (textParts.length > 0) {
            result = textParts.join('\n\n');
          }
        }

        // 如果没有从 output 数组提取到结果，尝试从 rawOutput 提取
        if (data.rawOutput) {
          const rawOutput = data.rawOutput;
          // 尝试提取output相关字段
          for (const key in rawOutput) {
            if (key.startsWith('output')) {
              const value = rawOutput[key];
              if (typeof value === 'string' && value.trim()) {
                if (!result) result = value;
              }
            }
          }

          // 如果还没有结果，尝试其他字段
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

          // 提取图片URL
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

        // 如果还是没有结果，尝试直接从 data 对象提取
        if (!result) {
          // 尝试提取output相关字段
          for (const key in data) {
            if (key.startsWith('output') && typeof data[key] === 'string' && data[key].trim()) {
              result = data[key];
              break;
            }
          }

          // 如果还没有结果，尝试其他字段
          if (!result) {
            result = data.text || data.content || data.result || data.data || data.message || '';
          }

          // 提取图片URL
          const candidateImage2 =
            (data as any).imageUrl ||
            (data as any).image_url ||
            (data as any).image ||
            (data as any).imageURL ||
            (data as any).img ||
            (data as any).picture ||
            (data as any).photo ||
            '';
          if (typeof candidateImage2 === 'string' && candidateImage2) imageUrls.push(candidateImage2);
        }
      } else if (typeof data === 'string') {
        result = data;
      }

      // 额外：从结果文本中提取图片 URL（用于 HTML / Markdown 中内嵌多图的场景）
      if (typeof result === 'string' && result) {
        const urlsFromContent = extractImageUrlsFromContent(result);
        if (urlsFromContent.length > 0) {
          imageUrls.push(...urlsFromContent);
        }
      }

      // 去重图片列表，并兼容单图字段
      imageUrls = Array.from(new Set(imageUrls.filter((it) => typeof it === 'string' && it.length > 0)));
      if (!imageUrl && imageUrls.length > 0) imageUrl = imageUrls[0];

      // 如果没有多段文本，但存在多张图片且有多个 Output，按图片拆分为多段
      if (!multiSegments.length && imageUrls.length > 1 && currentConnectedOutputs.length > 1) {
        multiSegments = imageUrls.map((url) => ({
          imageUrl: url,
          images: [url],
        }));
      }

      // 确保 result 是字符串类型
      if (result && typeof result !== 'string') {
        result = JSON.stringify(result);
      }

      if (!result && !imageUrl) {
        result = `工作流 "${shape.props.workflowName}" 执行完成`;
      }

      console.log(
        '[Workflow] 执行结果:',
        typeof result === 'string' && result.length > 100 ? result.substring(0, 100) + '...' : result,
      );
      if (imageUrl) {
        console.log('[Workflow] 图片 URL:', imageUrl);
      }

      // 更新 Workflow Shape 的生成时间
      console.log('[Workflow] 即将更新 Workflow shape，generatedTime =', generatedTime);
      editor.updateShape<WorkflowShape>({
        id: shape.id,
        type: 'workflow',
        props: { ...shape.props, generatedTime },
      });

      // 更新连接的 Output 框
      console.log('[Workflow] 更新连接的 Output 框:', currentConnectedOutputs);

      const hasMultiSegments = multiSegments.length > 1 && currentConnectedOutputs.length > 1;

      if (hasMultiSegments) {
        console.log(
          '[Workflow] 检测到多段输出，将按顺序分发到多个 Output 框',
          multiSegments.length,
          'segments ->',
          currentConnectedOutputs.length,
          'outputs',
        );

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

          // 只有当有图片或视频时才设置生成时间
          const hasMedia = segImages && segImages.length > 0;
          const finalGeneratedTime = hasMedia && generatedTime > 0 ? generatedTime : 0;
          
          console.log('[Workflow] 更新 Output 框(多段)', {
            generatedTime,
            hasMedia,
            finalGeneratedTime,
          });
          
          editor.updateShape({
            id: outputId as any,
            type: 'output',
            props: {
              ...outputShape.props,
              content: segText,
              imageUrl: segImageUrl,
              images: segImages,
              generatedTime: finalGeneratedTime,
            },
          });
          console.log('[Workflow] Output 框已更新(多段):', outputId, {
            index,
            segTextPreview: typeof segText === 'string' && segText.length > 40 ? segText.slice(0, 40) + '...' : segText,
          });
        });
      } else {
        for (const outputId of currentConnectedOutputs) {
          const outputShape = editor.getShape(outputId as any) as any;
          console.log('[Workflow] 找到 Output 框:', outputId, outputShape?.type);

          if (outputShape && outputShape.type === 'output') {
            // 只有当有图片或视频时才设置生成时间
            const hasMedia = imageUrls && imageUrls.length > 0;
            const finalGeneratedTime = hasMedia && generatedTime > 0 ? generatedTime : 0;
            
            console.log('[Workflow] 更新 Output 框', {
              generatedTime,
              hasMedia,
              finalGeneratedTime,
            });
            
            editor.updateShape({
              id: outputId as any,
              type: 'output',
              props: {
                ...outputShape.props,
                content: result,
                imageUrl: imageUrl,
                images: imageUrls,
                generatedTime: finalGeneratedTime,
              },
            });
            console.log('[Workflow] Output 框已更新:', outputId, { images: imageUrls.length, hasImage: !!imageUrl });
          }
        }
      }

      // 更新 connections 属性
      const sortedOldConnections = [...shape.props.connections].sort();
      const sortedNewConnections = [...currentConnectedOutputs].sort();
      if (JSON.stringify(sortedOldConnections) !== JSON.stringify(sortedNewConnections)) {
        editor.updateShape<WorkflowShape>({
          id: shape.id,
          type: 'workflow',
          props: { ...shape.props, connections: currentConnectedOutputs },
        });
      }

      console.log('[Workflow] 执行完成');
    } catch (error: any) {
      console.error('[Workflow] 执行失败:', error);
      if (error.name !== 'AbortError' && !opts?.silent) {
        alert(`执行失败: ${error instanceof Error ? error.message : '未知错误'}`);
      }
      if (opts?.silent) {
        throw error;
      }
    } finally {
      // 更新状态为未运行
      editor.updateShape<WorkflowShape>({
        id: shape.id,
        type: 'workflow',
        props: {
          ...shape.props,
          isRunning: false,
        },
      });
      workflowAbortControllers.delete(shape.id as any);
    }
  };

  // Expose imperative runtime handlers for "Run all" orchestration.
  // Use refs to always call the latest closures without re-registering on every render.
  const runRef = React.useRef<(opts?: { silent?: boolean }) => Promise<void>>(async () => {});
  const refreshInputsRef = React.useRef<() => void>(() => {});
  runRef.current = handleRun;
  refreshInputsRef.current = detectAndFillInstructionInputs;

  React.useEffect(() => {
    const runtime = {
      run: (opts?: { silent?: boolean }) => runRef.current(opts),
      refreshInputs: () => refreshInputsRef.current(),
    };
    registerWorkflowRuntime(shape.id as any, runtime);
    return () => unregisterWorkflowRuntime(shape.id as any, runtime);
  }, [shape.id]);

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        border: '2px solid #8B5CF6',
        borderRadius: '8px',
        backgroundColor: 'white',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        pointerEvents: 'all',
      }}
    >
      {/* 标题栏 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 12px',
          borderBottom: '1px solid #E5E7EB',
          backgroundColor: '#F5F3FF',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '16px',
              height: '16px',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M2 3.5L8 1L14 3.5V7.5C14 11 11.5 13.5 8 15C4.5 13.5 2 11 2 7.5V3.5Z"
                stroke="#8B5CF6"
                strokeWidth="1.5"
                fill="none"
              />
              <path d="M8 5V9M8 11H8.01" stroke="#8B5CF6" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          <span style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>Workflow</span>
        </div>
        <button
          onPointerDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('[Workflow] 按钮被点击（pointerDown）');
            handleRun();
          }}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          disabled={shape.props.isRunning}
          style={{
            width: '24px',
            height: '24px',
            border: 'none',
            backgroundColor: shape.props.isRunning ? '#EF4444' : '#8B5CF6',
            color: 'white',
            borderRadius: '4px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 0,
            pointerEvents: 'auto',
            position: 'relative',
            zIndex: 10,
          }}
          title={shape.props.isRunning ? '停止' : '运行工作流'}
        >
          {shape.props.isRunning ? (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <rect x="3" y="3" width="6" height="6" fill="currentColor" />
            </svg>
          ) : (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2 1L10 6L2 11V1Z" fill="currentColor" />
            </svg>
          )}
        </button>
      </div>

      {/* 内容区域 */}
      <div style={{ flex: 1, padding: '12px 12px 12px 24px', position: 'relative', overflow: 'auto' }}>
        <div style={{ marginBottom: '8px' }}>
          <div style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '4px' }}>
            {shape.props.workflowName || '未命名工作流'}
          </div>
          {shape.props.workflowDescription && (
            <div style={{ fontSize: '12px', color: '#6B7280', lineHeight: '1.4', marginBottom: '8px' }}>
              {shape.props.workflowDescription}
            </div>
          )}
        </div>

        {/* 输入参数区域 */}
        {shape.props.inputParams && shape.props.inputParams.length > 0 && (
          <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #E5E7EB', position: 'relative' }}>
            <div style={{ fontSize: '12px', fontWeight: '600', color: '#6B7280', marginBottom: '8px' }}>输入参数</div>
            {shape.props.inputParams.map((param, index) => {
              // 检查这个参数是否有连接
              const isConnected = shape.props.inputConnections?.some((conn) => conn.paramName === param.name);

              return (
                <div key={param.name} style={{ marginBottom: '8px', position: 'relative', paddingLeft: '4px' }}>
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '11px',
                      color: '#374151',
                      marginBottom: '4px',
                      fontWeight: '500',
                    }}
                  >
                    {isConnected && (
                      <span
                        style={{
                          display: 'inline-block',
                          width: '6px',
                          height: '6px',
                          backgroundColor: '#10B981',
                          borderRadius: '50%',
                        }}
                      />
                    )}
                    {param.displayName || param.name}
                    {param.required && <span style={{ color: '#EF4444' }}>*</span>}
                  </label>
                  {(param as any).typeOptions?.assetType === 'neural-model' ? (
                    <WorkflowNeuralModelField
                      param={param}
                      onChange={(value) => handleParamChange(param.name, value)}
                    />
                  ) : param.type === 'file' ? (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      onPointerDown={(e) => e.stopPropagation()}
                      style={{ pointerEvents: 'auto' }}
                    >
                      <VinesUploader
                        files={param.value ? (Array.isArray(param.value) ? param.value : [param.value]) : []}
                        onChange={(urls) => handleParamChange(param.name, urls.length > 0 ? urls[0] : '')}
                        max={1}
                        basePath="user-files/workflow-input"
                      />
                    </div>
                  ) : param.type === 'string' || param.type === 'text' ? (
                    <input
                      type="text"
                      value={param.value || ''}
                      onChange={(e) => handleParamChange(param.name, e.target.value)}
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={(e) => e.stopPropagation()}
                      placeholder={param.description || `输入${param.displayName || param.name}`}
                      style={{
                        width: '100%',
                        padding: '4px 8px',
                        fontSize: '11px',
                        border: '1px solid #D1D5DB',
                        borderRadius: '4px',
                        outline: 'none',
                        backgroundColor: 'white',
                        pointerEvents: 'auto',
                      }}
                    />
                  ) : param.type === 'number' ? (
                    <div>
                      {/* 如果有min/max值，显示滑动条 */}
                      {(param as any).typeOptions?.minValue !== undefined &&
                      (param as any).typeOptions?.maxValue !== undefined ? (
                        <div onClick={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()}>
                          <input
                            type="range"
                            min={(param as any).typeOptions.minValue}
                            max={(param as any).typeOptions.maxValue}
                            step={(param as any).typeOptions.numberPrecision || 1}
                            value={param.value || (param as any).typeOptions.minValue}
                            onChange={(e) => handleParamChange(param.name, parseFloat(e.target.value))}
                            style={{
                              width: '100%',
                              pointerEvents: 'auto',
                            }}
                          />
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              fontSize: '10px',
                              color: '#6B7280',
                              marginTop: '2px',
                            }}
                          >
                            <span>{(param as any).typeOptions.minValue}</span>
                            <span style={{ fontWeight: '600', color: '#374151' }}>
                              {param.value || (param as any).typeOptions.minValue}
                            </span>
                            <span>{(param as any).typeOptions.maxValue}</span>
                          </div>
                        </div>
                      ) : (
                        <input
                          type="number"
                          value={param.value || ''}
                          onChange={(e) => handleParamChange(param.name, parseFloat(e.target.value))}
                          onPointerDown={(e) => e.stopPropagation()}
                          onClick={(e) => e.stopPropagation()}
                          placeholder={param.description || `输入${param.displayName || param.name}`}
                          style={{
                            width: '100%',
                            padding: '4px 8px',
                            fontSize: '11px',
                            border: '1px solid #D1D5DB',
                            borderRadius: '4px',
                            outline: 'none',
                            backgroundColor: 'white',
                            pointerEvents: 'auto',
                          }}
                        />
                      )}
                    </div>
                  ) : param.type === 'boolean' ? (
                    <label
                      style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
                      onClick={(e) => e.stopPropagation()}
                      onPointerDown={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        checked={param.value || false}
                        onChange={(e) => handleParamChange(param.name, e.target.checked)}
                        style={{ pointerEvents: 'auto', cursor: 'pointer' }}
                      />
                      <span style={{ fontSize: '11px', color: '#6B7280' }}>{param.description || '启用'}</span>
                    </label>
                  ) : param.type === 'options' && (param as any).typeOptions?.options ? (
                    <select
                      value={param.value || ''}
                      onChange={(e) => handleParamChange(param.name, e.target.value)}
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        width: '100%',
                        padding: '4px 8px',
                        fontSize: '11px',
                        border: '1px solid #D1D5DB',
                        borderRadius: '4px',
                        outline: 'none',
                        backgroundColor: 'white',
                        pointerEvents: 'auto',
                        cursor: 'pointer',
                      }}
                    >
                      <option value="">请选择...</option>
                      {((param as any).typeOptions?.options || []).map((option: any) => (
                        <option key={option.value || option.name} value={option.value || option.name}>
                          {option.label || option.name || option.value}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <textarea
                      value={typeof param.value === 'string' ? param.value : JSON.stringify(param.value || '')}
                      onChange={(e) => handleParamChange(param.name, e.target.value)}
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={(e) => e.stopPropagation()}
                      placeholder={param.description || `输入${param.displayName || param.name}`}
                      rows={2}
                      style={{
                        width: '100%',
                        padding: '4px 8px',
                        fontSize: '11px',
                        border: '1px solid #D1D5DB',
                        borderRadius: '4px',
                        outline: 'none',
                        resize: 'vertical',
                        backgroundColor: 'white',
                        fontFamily: 'inherit',
                        pointerEvents: 'auto',
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div style={{ fontSize: '11px', color: '#9CA3AF', fontFamily: 'monospace', marginTop: '12px' }}>
          ID: {shape.props.workflowId}
        </div>
      </div>



      {/* 输入参数端口 - 在顶层渲染 */}
      {shape.props.inputParams &&
        shape.props.inputParams.map((param, index) => (
          <GenericPort key={param.name} shapeId={shape.id} portId={`param_${param.name}`} />
        ))}

      {/* Output Port - 使用通用的 Port 组件 */}
      <GenericPort shapeId={shape.id} portId="output" />
    </div>
  );
}
