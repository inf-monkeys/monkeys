import { BaseBoxShapeUtil, Editor, HTMLContainer, resizeBox } from 'tldraw';

import { OutputShape } from '../instruction/InstructionShape.types';

export class OutputShapeUtil extends BaseBoxShapeUtil<OutputShape> {
  static override type = 'output' as const;

  override isAspectRatioLocked = (_shape: OutputShape) => false;
  override canResize = (_shape: OutputShape) => true;
  override canBind = () => true;

  getDefaultProps(): OutputShape['props'] {
    return {
      w: 300,
      h: 200,
      content: '',
      color: 'green',
      sourceId: '',
      imageUrl: '',
    };
  }

  override onResize = (shape: OutputShape, info: any) => {
    return resizeBox(shape, info);
  };

  component(shape: OutputShape) {
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
        <OutputShapeComponent shape={shape} editor={this.editor} />
      </HTMLContainer>
    );
  }

  indicator(shape: OutputShape) {
    return <rect width={shape.props.w} height={shape.props.h} />;
  }
}

function OutputShapeComponent({ shape, editor }: { shape: OutputShape; editor: Editor }) {
  const handleConnectionPoint = (e: React.MouseEvent) => {
    e.stopPropagation();
    // 连接点可以用于接收连线
  };

  const hasImage = shape.props.imageUrl && shape.props.imageUrl.length > 0 && shape.props.imageUrl.startsWith('http');
  const hasContent = shape.props.content && shape.props.content.length > 0;

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        border: '2px solid #059669',
        borderRadius: '8px',
        backgroundColor: 'white',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
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
          backgroundColor: '#F0FDF4',
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
            <div style={{ width: '4px', height: '4px', backgroundColor: '#059669', borderRadius: '50%' }} />
            <div style={{ width: '4px', height: '4px', backgroundColor: '#059669', borderRadius: '50%' }} />
            <div style={{ width: '4px', height: '4px', backgroundColor: '#059669', borderRadius: '50%' }} />
            <div style={{ width: '4px', height: '4px', backgroundColor: '#059669', borderRadius: '50%' }} />
          </div>
          <span style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>Output</span>
        </div>
      </div>

      {/* 内容区域 */}
      <div
        style={{
          flex: 1,
          padding: '12px',
          overflow: 'auto',
          position: 'relative',
        }}
      >
        {!hasContent && !hasImage && (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#9CA3AF',
              fontSize: '14px',
            }}
          >
            等待输出结果...
          </div>
        )}

        {hasImage && (
          <div style={{ marginBottom: hasContent ? '12px' : 0 }}>
            <img
              src={shape.props.imageUrl}
              alt="Output"
              style={{
                maxWidth: '100%',
                maxHeight: hasContent ? '200px' : '100%',
                objectFit: 'contain',
                borderRadius: '4px',
              }}
            />
          </div>
        )}

        {hasContent && (
          <div
            style={{
              fontSize: '14px',
              color: '#374151',
              lineHeight: '1.5',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {shape.props.content}
          </div>
        )}
      </div>

      {/* 左侧连接点 */}
      <div
        onMouseDown={handleConnectionPoint}
        style={{
          position: 'absolute',
          left: '-8px',
          top: '50%',
          transform: 'translateY(-50%)',
          width: '16px',
          height: '16px',
          backgroundColor: '#059669',
          border: '2px solid white',
          borderRadius: '50%',
          cursor: 'crosshair',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
          zIndex: 10,
        }}
      />
    </div>
  );
}
