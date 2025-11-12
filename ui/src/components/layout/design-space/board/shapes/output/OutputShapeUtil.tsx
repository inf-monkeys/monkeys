import { BaseBoxShapeUtil, Circle2d, Editor, Group2d, HTMLContainer, Rectangle2d, resizeBox } from 'tldraw';

import { VinesMarkdown } from '@/components/ui/markdown';

import { OutputShape } from '../instruction/InstructionShape.types';
import { GenericPort } from '../ports/GenericPort';
import { getOutputPorts } from '../ports/shapePorts';

const PORT_RADIUS_PX = 8;

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
      images: [],
    };
  }

  override onResize = (shape: OutputShape, info: any) => {
    return resizeBox(shape, info);
  };

  // Define geometry including ports
  getGeometry(shape: OutputShape) {
    const ports = getOutputPorts(this.editor, shape);

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
    const ports = Object.values(getOutputPorts(this.editor, shape));
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

function OutputShapeComponent({ shape, editor }: { shape: OutputShape; editor: Editor }) {

  const images = (Array.isArray(shape.props.images) ? shape.props.images : [])
    .filter((it) => typeof it === 'string' && it.length > 0);
  // 兼容旧字段 imageUrl
  if ((!images || images.length === 0) && shape.props.imageUrl && shape.props.imageUrl.length > 0) {
    images.push(shape.props.imageUrl);
  }
  const hasImages = images.length > 0;
  const hasContent = shape.props.content && shape.props.content.length > 0;

  // 从 Markdown/HTML 文本中尝试提取图片链接（当 props.images 未提供但内容里内嵌了图片或下载链接时）
  const extractImageUrlsFromContent = (content: string): string[] => {
    if (!content) return [];
    const urls = new Set<string>();

    // 1) Markdown 图片语法: ![alt](url)
    for (const m of content.matchAll(/!\[[^\]]*]\((https?:\/\/[^\s)]+)\)/gi)) {
      urls.add(m[1]);
    }
    // 2) Markdown 链接（当链接目标是图片时）: [text](url)
    for (const m of content.matchAll(/\[[^\]]*]\((https?:\/\/[^\s)]+)\)/gi)) {
      const u = m[1];
      if (/\.(png|jpe?g|webp|gif|bmp|svg)(\?.*)?$/i.test(u)) urls.add(u);
    }
    // 3) HTML 图片: <img src="url" ...>
    for (const m of content.matchAll(/<img[^>]+src=["'](https?:\/\/[^"']+)["'][^>]*>/gi)) {
      urls.add(m[1]);
    }
    // 4) 文本中的裸链接（以图片扩展名结尾）
    for (const m of content.matchAll(/https?:\/\/[^\s"'')]+/gi)) {
      const u = m[0];
      if (/\.(png|jpe?g|webp|gif|bmp|svg)(\?.*)?$/i.test(u)) urls.add(u);
    }

    return Array.from(urls);
  };

  const derivedImages = !hasImages && hasContent ? extractImageUrlsFromContent(shape.props.content) : [];
  const imagesToShow = hasImages ? images : derivedImages;
  const showImages = imagesToShow.length > 0;

  // 检测内容是否是 markdown 格式
  const isMarkdown = (text: string): boolean => {
    if (!text || typeof text !== 'string') return false;
    // 检查常见的 markdown 语法特征
    const markdownPatterns = [
      /^#{1,6}\s+.+$/m, // 标题
      /\*\*.*?\*\*/, // 粗体
      /\*.*?\*/, // 斜体
      /`.*?`/, // 行内代码
      /```[\s\S]*?```/, // 代码块
      /^[-*+]\s+.+$/m, // 无序列表
      /^\d+\.\s+.+$/m, // 有序列表
      /\[.*?\]\(.*?\)/, // 链接
      /^>\s+.+$/m, // 引用
      /^\|.*\|.*\|$/m, // 表格
    ];
    return markdownPatterns.some((pattern) => pattern.test(text));
  };

  const contentIsMarkdown = hasContent && isMarkdown(shape.props.content);

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
        {!hasContent && !showImages && (
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

        {showImages && (
          <div style={{ marginBottom: hasContent ? '12px' : 0, display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
            {imagesToShow.map((url, idx) => (
              <img
                key={`${url}_${idx}`}
                src={url}
                alt={`Output_${idx + 1}`}
                style={{
                  maxWidth: '100%',
                  maxHeight: hasContent ? '200px' : '100%',
                  objectFit: 'contain',
                  borderRadius: '4px',
                }}
              />
            ))}
          </div>
        )}

        {hasContent && !showImages && (
          <div
            style={{
              fontSize: '14px',
              color: '#374151',
              lineHeight: '1.5',
              wordBreak: 'break-word',
            }}
          >
            {contentIsMarkdown ? (
              <div
                style={{
                  fontSize: '14px',
                  color: '#374151',
                }}
              >
                <VinesMarkdown
                  className="prose prose-sm max-w-none prose-headings:text-gray-800 prose-headings:font-semibold prose-headings:mt-4 prose-headings:mb-2 prose-p:text-gray-700 prose-p:my-2 prose-p:leading-relaxed prose-strong:text-gray-900 prose-strong:font-semibold prose-code:text-gray-800 prose-code:bg-gray-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-code:font-mono prose-pre:bg-gray-50 prose-pre:border prose-pre:border-gray-200 prose-pre:rounded-md prose-pre:p-3 prose-pre:overflow-x-auto prose-pre:my-2 prose-ul:my-2 prose-ol:my-2 prose-li:my-1 prose-li:text-gray-700 prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline prose-blockquote:border-l-4 prose-blockquote:border-gray-300 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-gray-600 prose-blockquote:my-2 prose-table:border-collapse prose-table:w-full prose-table:my-2 prose-th:border prose-th:border-gray-300 prose-th:bg-gray-50 prose-th:p-2 prose-th:text-left prose-th:font-semibold prose-td:border prose-td:border-gray-300 prose-td:p-2"
                >
                  {shape.props.content}
                </VinesMarkdown>
              </div>
            ) : (
              <div
                style={{
                  whiteSpace: 'pre-wrap',
                }}
              >
                {shape.props.content}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Input Port - 左侧输入端口 */}
      <GenericPort shapeId={shape.id} portId="input" />
      
      {/* Output Port - 右侧输出端口 */}
      <GenericPort shapeId={shape.id} portId="output" />
    </div>
  );
}
