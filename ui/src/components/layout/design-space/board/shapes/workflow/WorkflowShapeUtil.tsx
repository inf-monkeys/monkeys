import { vinesHeader } from '@/apis/utils';
import { VinesUploader } from '@/components/ui/vines-uploader';
import {
  BaseBoxShapeUtil,
  Editor,
  HTMLContainer,
  resizeBox,
} from 'tldraw';
import { WorkflowShape } from './WorkflowShape.types';

// 形状级别的运行中请求控制器
const workflowAbortControllers = new Map<string, AbortController>();

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
    };
  }

  override onResize = (shape: WorkflowShape, info: any) => {
    return resizeBox(shape, info);
  };

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
    return <rect width={shape.props.w} height={shape.props.h} />;
  }
}

function WorkflowShapeComponent({ shape, editor }: { shape: WorkflowShape; editor: Editor }) {
  const handleParamChange = (paramName: string, value: any) => {
    const updatedParams = shape.props.inputParams.map(param => 
      param.name === paramName ? { ...param, value } : param
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

  const detectConnectedOutputs = (): string[] => {
    // 宽松判定（端点在矩形内+padding）
    const isPointInRect = (p: { x: number; y: number }, r: { x: number; y: number; w: number; h: number }) =>
      p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h;
    const expandRect = (r: { x: number; y: number; w: number; h: number }, padding = 24) => ({
      x: r.x - padding,
      y: r.y - padding,
      w: r.w + padding * 2,
      h: r.h + padding * 2,
    });
    const outputs: string[] = [];
    const allShapes = editor.getCurrentPageShapes();
    const arrows = allShapes.filter((s) => s.type === 'arrow') as any[];
    const selfBounds = editor.getShapePageBounds(shape.id as any);
    arrows.forEach((arrow) => {
      const start = arrow.props.start as any;
      const end = arrow.props.end as any;
      // 绑定优先
      if (start?.type === 'binding' && start.boundShapeId === shape.id && end?.type === 'binding') {
        const endShape = editor.getShape(end.boundShapeId);
        if (endShape?.type === 'output') outputs.push(end.boundShapeId);
        return;
      }
      // 宽松：判断端点是否位于本 Workflow 和某个 Output 区域
      const startAbs = { x: arrow.x + (start?.x ?? 0), y: arrow.y + (start?.y ?? 0) };
      const endAbs = { x: arrow.x + (end?.x ?? 0), y: arrow.y + (end?.y ?? 0) };
      if (selfBounds && isPointInRect(startAbs, expandRect(selfBounds))) {
        for (const s of allShapes) {
          if (s.type !== 'output') continue;
          const b = editor.getShapePageBounds(s.id as any);
          if (!b) continue;
          if (isPointInRect(endAbs, expandRect(b))) outputs.push(s.id as any);
        }
      }
    });
    return Array.from(new Set(outputs));
  };

  const handleRun = async () => {
    console.log('[Workflow] 播放按钮被点击', {
      shapeId: shape.id,
      workflowId: shape.props.workflowId,
      workflowName: shape.props.workflowName,
      connections: shape.props.connections,
    });

    if (!shape.props.workflowId || shape.props.workflowId.trim() === '') {
      console.warn('[Workflow] 工作流ID为空，取消执行');
      alert('工作流ID为空');
      return;
    }

    if (!shape.props.connections || shape.props.connections.length === 0) {
      const detected = detectConnectedOutputs();

      if (detected.length === 0) {
        console.warn('[Workflow] 没有连接的 Output 框');
        alert('请先用箭头工具连接到 Output 框');
        return;
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
        try { controller.abort(); } catch {}
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
        alert('请先用箭头工具连接到 Output 框');
        return;
      }
      
      // 调用工作流执行API
      const controller = new AbortController();
      workflowAbortControllers.set(shape.id as any, controller);
      
      // 构建输入参数对象
      const inputs: Record<string, any> = {};
      shape.props.inputParams.forEach(param => {
        inputs[param.name] = param.value;
      });
      
      console.log('[Workflow] 执行参数:', inputs);
      
      // 调用工作流执行API
      const response = await fetch(`/api/workflow/${shape.props.workflowId}/execute`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          ...vinesHeader({ useToast: true }) 
        },
        body: JSON.stringify({
          inputs: inputs,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`工作流执行失败: ${response.status}`);
      }

      console.log('[Workflow] API 响应状态:', response.status);

      const responseData = await response.json();
      const data = responseData?.data || responseData;
      let result = '';
      let imageUrl = '';

      console.log('[Workflow] API 响应数据:', data);

      // 提取结果
      if (typeof data === 'string') {
        result = data;
      } else if (data && typeof data === 'object') {
        // 尝试提取output相关字段
        for (const key in data) {
          if (key.startsWith('output')) {
            const value = data[key];
            if (typeof value === 'string' && value.trim()) {
              result = value;
              break;
            }
          }
        }

        // 如果还没有结果，尝试其他字段
        if (!result) {
          result = data.text || data.content || data.result || data.data || data.message || 
                   data.output || '';
        }

        // 提取图片URL
        imageUrl = data.imageUrl || data.image_url || data.image || data.imageURL || 
                   data.img || data.picture || data.photo || '';
      }

      if (!result && !imageUrl) {
        result = `工作流 "${shape.props.workflowName}" 执行完成`;
      }

      console.log('[Workflow] 执行结果:', result.substring(0, 100) + '...');
      if (imageUrl) {
        console.log('[Workflow] 图片 URL:', imageUrl);
      }

      // 更新连接的 Output 框
      console.log('[Workflow] 更新连接的 Output 框:', currentConnectedOutputs);
      
      for (const outputId of currentConnectedOutputs) {
        const outputShape = editor.getShape(outputId as any) as any;
        console.log('[Workflow] 找到 Output 框:', outputId, outputShape?.type);
        
        if (outputShape && outputShape.type === 'output') {
          editor.updateShape({
            id: outputId as any,
            type: 'output',
            props: {
              ...outputShape.props,
              content: result,
              imageUrl: imageUrl,
            },
          });
          console.log('[Workflow] Output 框已更新:', outputId, { hasImage: !!imageUrl });
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
      if (error.name !== 'AbortError') {
        alert(`执行失败: ${error instanceof Error ? error.message : '未知错误'}`);
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

  const handleConnectionPoint = (e: React.MouseEvent) => {
    e.stopPropagation();
    // 触发连线模式
    editor.setCurrentTool('arrow');
  };

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
      <div style={{ flex: 1, padding: '12px', position: 'relative', overflow: 'auto' }}>
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
          <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #E5E7EB' }}>
            <div style={{ fontSize: '12px', fontWeight: '600', color: '#6B7280', marginBottom: '8px' }}>
              输入参数
            </div>
            {shape.props.inputParams.map((param) => (
              <div key={param.name} style={{ marginBottom: '8px' }}>
                <label style={{ 
                  display: 'block', 
                  fontSize: '11px', 
                  color: '#374151', 
                  marginBottom: '4px',
                  fontWeight: '500',
                }}>
                  {param.displayName || param.name}
                  {param.required && <span style={{ color: '#EF4444' }}>*</span>}
                </label>
                {param.type === 'file' ? (
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
                  <input
                    type="number"
                    value={param.value || ''}
                    onChange={(e) => handleParamChange(param.name, parseFloat(e.target.value))}
                    onPointerDown={(e) => e.stopPropagation()}
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
                ) : param.type === 'boolean' ? (
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={param.value || false}
                      onChange={(e) => handleParamChange(param.name, e.target.checked)}
                      onPointerDown={(e) => e.stopPropagation()}
                      style={{ pointerEvents: 'auto' }}
                    />
                    <span style={{ fontSize: '11px', color: '#6B7280' }}>
                      {param.description || '启用'}
                    </span>
                  </label>
                ) : param.type === 'options' && (param as any).typeOptions?.options ? (
                  <select
                    value={param.value || ''}
                    onChange={(e) => handleParamChange(param.name, e.target.value)}
                    onPointerDown={(e) => e.stopPropagation()}
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
            ))}
          </div>
        )}
        
        <div style={{ fontSize: '11px', color: '#9CA3AF', fontFamily: 'monospace', marginTop: '12px' }}>
          ID: {shape.props.workflowId}
        </div>
      </div>

      {/* 右侧连接点 */}
      <div
        onPointerDown={(e) => {
          e.stopPropagation();
          handleConnectionPoint(e as any);
        }}
        style={{
          position: 'absolute',
          right: '-8px',
          top: '50%',
          transform: 'translateY(-50%)',
          width: '16px',
          height: '16px',
          backgroundColor: '#8B5CF6',
          border: '2px solid white',
          borderRadius: '50%',
          cursor: 'crosshair',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
          zIndex: 10,
          pointerEvents: 'auto',
        }}
      />
    </div>
  );
}

