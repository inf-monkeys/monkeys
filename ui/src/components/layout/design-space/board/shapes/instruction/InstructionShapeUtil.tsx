import { BaseBoxShapeUtil, Circle2d, Editor, Group2d, HTMLContainer, Rectangle2d, resizeBox } from 'tldraw';

import { vinesHeader } from '@/apis/utils';
import { VinesUploader } from '@/components/ui/vines-uploader';

import { GenericPort } from '../ports/GenericPort';
import { getShapePortConnections } from '../ports/portConnections';
import { getInstructionPorts } from '../ports/shapePorts';
import { InstructionShape } from './InstructionShape.types';

const PORT_RADIUS_PX = 8;

// 形状级别的运行中请求控制器
const instructionAbortControllers = new Map<string, AbortController>();

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
      imageUrl: '',
      inputMode: 'text',
      color: 'blue',
      isRunning: false,
      connections: [],
    };
  }

  override onResize = (shape: InstructionShape, info: any) => {
    return resizeBox(shape, info);
  };

  // Define geometry including ports
  getGeometry(shape: InstructionShape) {
    const ports = getInstructionPorts(this.editor, shape);

    const portGeometries = Object.values(ports).map(
      (port) =>
        new Circle2d({
          x: port.x - PORT_RADIUS_PX,
          y: port.y - PORT_RADIUS_PX,
          radius: PORT_RADIUS_PX,
          isFilled: true,
          isLabel: true,
          excludeFromShapeBounds: true,
        })
    );

    const bodyGeometry = new Rectangle2d({
      width: shape.props.w,
      height: shape.props.h,
      isFilled: true,
    });

    return new Group2d({
      children: [bodyGeometry, ...portGeometries],
    });
  }

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
    const ports = Object.values(getInstructionPorts(this.editor, shape));
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

  const handleImageChange = (urls: string[]) => {
    editor.updateShape<InstructionShape>({
      id: shape.id,
      type: 'instruction',
      props: {
        ...shape.props,
        imageUrl: urls.length > 0 ? urls[0] : '',
      },
    });
  };

  // 使用新的 ConnectionBinding 系统检测连接的 Output
  const detectConnectedOutputs = (): string[] => {
    const outputs: string[] = [];
    
    // 使用新的端口连接系统
    const connections = getShapePortConnections(editor, shape.id);
    
    for (const connection of connections) {
      // 查找从 Instruction 的 output 端口出发的连接（terminal === 'start'）
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
    
    return Array.from(new Set(outputs));
  };

  const handleRun = async () => {
    console.log('[Instruction] 播放按钮被点击', {
      shapeId: shape.id,
      content: shape.props.content,
      imageUrl: shape.props.imageUrl,
      inputMode: shape.props.inputMode,
      connections: shape.props.connections,
    });

    // 验证输入
    if (shape.props.inputMode === 'text') {
      if (!shape.props.content || shape.props.content.trim() === '') {
        console.warn('[Instruction] 文字内容为空，取消执行');
        alert('请先输入指令内容');
        return;
      }
    } else if (shape.props.inputMode === 'image') {
      if (!shape.props.imageUrl || shape.props.imageUrl.trim() === '') {
        console.warn('[Instruction] 图片为空，取消执行');
        alert('请先上传图片');
        return;
      }
    }

    // 检测连接的 Output（使用新的 ConnectionBinding 系统）
    const detected = detectConnectedOutputs();
    
    if (detected.length === 0) {
      console.warn('[Instruction] 没有连接的 Output 框');
      alert('请先连接到 Output 框');
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

    // 如果已在运行，则执行“停止”逻辑
    if (shape.props.isRunning) {
      const controller = instructionAbortControllers.get(shape.id as any);
      if (controller) {
        try {
          controller.abort();
        } catch {}
      }
      editor.updateShape<InstructionShape>({
        id: shape.id,
        type: 'instruction',
        props: { ...shape.props, isRunning: false },
      });
      console.log('[Instruction] 已请求停止');
      return;
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
      console.log('[Instruction] 开始调用文本扩写 API...');

      // 实时检测连接的Output框（确保使用最新的连接状态）
      const currentConnectedOutputs = detectConnectedOutputs();
      console.log('[Instruction] 当前连接的 Output 框:', currentConnectedOutputs);

      if (currentConnectedOutputs.length === 0) {
        console.warn('[Instruction] 没有连接的 Output 框');
        // 恢复运行状态
        editor.updateShape<InstructionShape>({
          id: shape.id,
          type: 'instruction',
          props: { ...shape.props, isRunning: false },
        });
        alert('请先用箭头工具连接到 Output 框');
        return;
      }

      // 根据输入模式选择API
      let apiEndpoint: string;
      let requestBody: any;

      if (shape.props.inputMode === 'image') {
        // 图片输入模式 - 使用图生文或图生图API
        apiEndpoint = '/api/image-to-text'; // 根据实际API调整
        requestBody = {
          imageUrl: shape.props.imageUrl,
        };
        console.log('[Instruction] 使用图片输入 API:', apiEndpoint);
      } else {
        // 文字输入模式 - 判断是文生图还是文本扩写
        const isTextToImage = /[图画像]|image|picture|photo|生成图|画一|绘制/i.test(shape.props.content);
        apiEndpoint = isTextToImage ? '/api/text-expansion/text-to-image' : '/api/text-expansion/expand';
        requestBody = {
          text: shape.props.content,
          prompt: shape.props.content,
        };
        console.log('[Instruction] 使用文字输入 API:', isTextToImage ? '文生图' : '文本扩写', apiEndpoint);
      }

      // 调用 API
      const controller = new AbortController();
      instructionAbortControllers.set(shape.id as any, controller);

      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...vinesHeader({ useToast: true }),
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`扩写请求失败: ${response.status}`);
      }

      console.log('[Instruction] API 响应状态:', response.status);

      const responseData = await response.json();
      const data = responseData?.data || responseData;
      let result = '';
      let imageUrl = '';

      console.log('[Instruction] API 响应数据:', data);

      // 如果 data 直接就是字符串（文本扩写 API 的情况）
      if (typeof data === 'string') {
        result = data;
        console.log('[Instruction] 文本扩写结果:', result);
      }
      // 如果是对象格式，尝试提取图片URL
      else if (data && typeof data === 'object' && data.imageUrl) {
        imageUrl = data.imageUrl;
        result = data.text || shape.props.content;
        console.log('[Instruction] 文生图结果:', { imageUrl, text: result });
      }
      // 如果是对象格式，尝试提取内容
      else if (data && typeof data === 'object') {
        // 首先尝试遍历所有字段，查找output相关的字段（如output1, output2等）
        for (const key in data) {
          if (key.startsWith('output')) {
            const value = data[key];
            if (typeof value === 'string' && value.trim()) {
              result = value;
              break;
            }
          }
        }
      }

      // 如果还没有结果且 data 是对象，继续尝试其他提取方式
      if (!result && typeof data === 'object' && data) {
        // 如果有output字段，尝试提取
        if (data?.output) {
          if (Array.isArray(data.output) && data.output[0]) {
            const firstOutput = data.output[0];
            result = firstOutput.text || firstOutput.content || firstOutput.data || firstOutput.value || '';
          } else if (typeof data.output === 'object') {
            result =
              data.output.text ||
              data.output.content ||
              data.output.data ||
              data.output.value ||
              data.output.result ||
              data.output.message ||
              '';
          } else if (typeof data.output === 'string') {
            result = data.output;
          }
        }

        // 如果没有从output中获取到，尝试从根级别的字段获取
        if (!result) {
          result =
            data.text ||
            data.content ||
            data.result ||
            data.data ||
            data.message ||
            data.expanded ||
            data.expandedText ||
            '';
        }

        // 提取图片 URL（支持多种可能的字段名）- 对于非文生图API也可能有图片
        if (!imageUrl) {
          imageUrl =
            data.imageUrl ||
            data.image_url ||
            data.image ||
            data.imageURL ||
            data.img ||
            data.picture ||
            data.photo ||
            '';

          // 如果有output对象，也从中尝试提取图片
          if (!imageUrl && data?.output && typeof data.output === 'object' && !Array.isArray(data.output)) {
            imageUrl =
              data.output.imageUrl ||
              data.output.image_url ||
              data.output.image ||
              data.output.imageURL ||
              data.output.img ||
              '';
          }
        }
      }

      // 如果还是没有结果，使用原文
      if (!result) {
        result = shape.props.content;
        console.warn('[Instruction] 无法提取扩写结果，使用原文');
      }

      console.log('[Instruction] 扩写结果:', result.substring(0, 100) + '...');
      if (imageUrl) {
        console.log('[Instruction] 图片 URL:', imageUrl);
      }

      // 使用实时检测到的连接关系更新 Output 框
      console.log('[Instruction] 更新连接的 Output 框:', currentConnectedOutputs);

      for (const outputId of currentConnectedOutputs) {
        const outputShape = editor.getShape(outputId as any) as any;
        console.log('[Instruction] 找到 Output 框:', outputId, outputShape?.type);

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
          console.log('[Instruction] Output 框已更新:', outputId, { hasImage: !!imageUrl });
        }
      }

      // 更新 connections 属性以保持同步
      const sortedOldConnections = [...shape.props.connections].sort();
      const sortedNewConnections = [...currentConnectedOutputs].sort();
      if (JSON.stringify(sortedOldConnections) !== JSON.stringify(sortedNewConnections)) {
        editor.updateShape<InstructionShape>({
          id: shape.id,
          type: 'instruction',
          props: { ...shape.props, connections: currentConnectedOutputs },
        });
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
      instructionAbortControllers.delete(shape.id as any);
    }
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
            // 切换：未运行 -> 开始；运行中 -> 停止
            handleRun();
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
            backgroundColor: shape.props.isRunning ? '#EF4444' : '#3B82F6',
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
          title={shape.props.isRunning ? '停止' : '运行指令'}
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
      <div style={{ flex: 1, padding: '12px', position: 'relative' }}>
        {shape.props.inputMode === 'text' ? (
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
        ) : (
          <div
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              height: '100%',
              pointerEvents: 'auto',
            }}
          >
            <VinesUploader
              files={shape.props.imageUrl ? [shape.props.imageUrl] : []}
              onChange={handleImageChange}
              max={1}
              basePath="user-files/instruction-input"
            />
          </div>
        )}
      </div>

      {/* Output Port - 使用通用的 Port 组件 */}
      <GenericPort shapeId={shape.id} portId="output" />
    </div>
  );
}
