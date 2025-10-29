import { vinesHeader } from '@/apis/utils';
import {
  BaseBoxShapeUtil,
  Editor,
  HTMLContainer,
  resizeBox,
} from 'tldraw';
import { InstructionShape } from './InstructionShape.types';

export class InstructionShapeUtil extends BaseBoxShapeUtil<InstructionShape> {
  static override type = 'instruction' as const;

  override isAspectRatioLocked = (_shape: InstructionShape) => false;
  override canResize = (_shape: InstructionShape) => true;
  override canBind = () => true;

  getDefaultProps(): InstructionShape['props'] {
    return {
      w: 300,
      h: 200,
      content: '',
      color: 'blue',
      isRunning: false,
      connections: [],
    };
  }

  override onResize = (shape: InstructionShape, info: any) => {
    return resizeBox(shape, info);
  };

  component(shape: InstructionShape) {
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
        <InstructionShapeComponent shape={shape} editor={this.editor} />
      </HTMLContainer>
    );
  }

  indicator(shape: InstructionShape) {
    return <rect width={shape.props.w} height={shape.props.h} />;
  }
}

function InstructionShapeComponent({ shape, editor }: { shape: InstructionShape; editor: Editor }) {
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    editor.updateShape<InstructionShape>({
      id: shape.id,
      type: 'instruction',
      props: {
        ...shape.props,
        content: e.target.value,
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
      // 宽松：判断端点是否位于本 Instruction 和某个 Output 区域
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
    console.log('[Instruction] 播放按钮被点击', {
      shapeId: shape.id,
      content: shape.props.content,
      connections: shape.props.connections,
    });

    if (!shape.props.content || shape.props.content.trim() === '') {
      console.warn('[Instruction] 内容为空，取消执行');
      alert('请先输入指令内容');
      return;
    }

    if (!shape.props.connections || shape.props.connections.length === 0) {
      const detected = detectConnectedOutputs();

      if (detected.length === 0) {
        console.warn('[Instruction] 没有连接的 Output 框');
        alert('请先用箭头工具连接到 Output 框');
        return;
      }
      // 同步存储 connections，后续也用运行时 detected 为准
      try {
        editor.updateShape<InstructionShape>({
          id: shape.id,
          type: 'instruction',
          props: { ...shape.props, connections: detected },
        });
      } catch {}
    }

    // 更新状态为运行中
    editor.updateShape<InstructionShape>({
      id: shape.id,
      type: 'instruction',
      props: {
        ...shape.props,
        isRunning: true,
      },
    });

    try {
      console.log('[Instruction] 开始调用 API...');
      
      // 调用 Agent API（多端点回退）
      const endpoints = [
        '/api/tldraw-agent-v2/stream',
        '/tldraw-agent-v2/stream',
        '/api/v1/tldraw-agent-v2/stream',
        'http://localhost:33002/api/tldraw-agent-v2/stream',
      ];
      let response: Response | null = null;
      for (const url of endpoints) {
        try {
          const resp = await fetch(url, {
        method: 'POST',
            headers: { 'Content-Type': 'application/json', ...vinesHeader({ useToast: true }) },
        body: JSON.stringify({
          message: shape.props.content,
          context: {
            shapeId: shape.id,
          },
        }),
          });
          if (resp.ok) { response = resp; break; }
          console.warn('[Instruction] 端点失败', url, resp.status);
        } catch (e) {
          console.warn('[Instruction] 端点异常', url, e);
        }
      }

      if (!response) throw new Error('API call failed across all endpoints');
      console.log('[Instruction] API 响应状态:', response.status);

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let result = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.content) {
                  result += data.content;
                }
              } catch (e) {
                console.error('Failed to parse SSE data:', e);
              }
            }
          }
        }
      }

      console.log('[Instruction] API 返回结果:', result.substring(0, 100) + '...');

      // 找到所有连接的 output shapes 并更新它们
      const connectedOutputs = shape.props.connections;
      console.log('[Instruction] 更新连接的 Output 框:', connectedOutputs);
      
      for (const outputId of connectedOutputs) {
        const outputShape = editor.getShape(outputId as any) as any;
        console.log('[Instruction] 找到 Output 框:', outputId, outputShape?.type);
        
        if (outputShape && outputShape.type === 'output') {
          editor.updateShape({
            id: outputId as any,
            type: 'output',
            props: {
              ...outputShape.props,
              content: result,
            },
          });
          console.log('[Instruction] Output 框已更新:', outputId);
        }
      }
      
      console.log('[Instruction] 执行完成');
    } catch (error) {
      console.error('[Instruction] 执行失败:', error);
      alert(`执行失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      // 更新状态为未运行
      editor.updateShape<InstructionShape>({
        id: shape.id,
        type: 'instruction',
        props: {
          ...shape.props,
          isRunning: false,
        },
      });
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
        border: '2px solid #4B5563',
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
          backgroundColor: '#F9FAFB',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '2px',
              width: '12px',
              height: '12px',
            }}
          >
            <div style={{ width: '4px', height: '4px', backgroundColor: '#6B7280', borderRadius: '50%' }} />
            <div style={{ width: '4px', height: '4px', backgroundColor: '#6B7280', borderRadius: '50%' }} />
            <div style={{ width: '4px', height: '4px', backgroundColor: '#6B7280', borderRadius: '50%' }} />
            <div style={{ width: '4px', height: '4px', backgroundColor: '#6B7280', borderRadius: '50%' }} />
          </div>
          <span style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>Instruction</span>
        </div>
        <button
          onPointerDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('[Instruction] 按钮被点击（pointerDown）');
            if (!shape.props.isRunning) {
              handleRun();
            }
          }}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('[Instruction] 按钮被点击（onClick）');
          }}
          disabled={shape.props.isRunning}
          style={{
            width: '24px',
            height: '24px',
            border: 'none',
            backgroundColor: shape.props.isRunning ? '#9CA3AF' : '#3B82F6',
            color: 'white',
            borderRadius: '4px',
            cursor: shape.props.isRunning ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 0,
            pointerEvents: 'auto',
            position: 'relative',
            zIndex: 10,
          }}
          title="运行指令"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2 1L10 6L2 11V1Z" fill="currentColor" />
          </svg>
        </button>
      </div>

      {/* 内容区域 */}
      <div style={{ flex: 1, padding: '12px', position: 'relative' }}>
        <textarea
          value={shape.props.content}
          onChange={handleContentChange}
          onPointerDown={(e) => {
            // 允许文本框接收点击，但不传播到外层
            e.stopPropagation();
          }}
          placeholder="可以输入内容"
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            outline: 'none',
            resize: 'none',
            fontSize: '14px',
            fontFamily: 'inherit',
            color: '#374151',
            backgroundColor: 'transparent',
            pointerEvents: 'auto',
          }}
        />
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
          backgroundColor: '#3B82F6',
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

