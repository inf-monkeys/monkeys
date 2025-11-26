import { useCallback, useRef, useState } from 'react';

import { Edit3, Eye, ImagePlus, Loader2 } from 'lucide-react';
import { nanoid } from 'nanoid';
import { BaseBoxShapeUtil, Circle2d, Editor, Group2d, HTMLContainer, Rectangle2d, resizeBox } from 'tldraw';

import { createMediaFile } from '@/apis/resources';
import { VinesResourceSource, VinesResourceType } from '@/apis/resources/typting.ts';
import { VinesMarkdown } from '@/components/ui/markdown';

import { OutputShape } from '../instruction/InstructionShape.types';
import { GenericPort } from '../ports/GenericPort';
import { getOutputPorts } from '../ports/shapePorts';

const PORT_RADIUS_PX = 8;

// 图片替换组件 - 支持点击上传替换
function ImageReplaceZone({
  imageUrl,
  index,
  onReplace,
}: {
  imageUrl: string;
  index: number;
  onReplace: (index: number, newUrl: string) => void;
}) {
  const [isHover, setIsHover] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 上传文件到服务器
  const uploadFile = async (file: File): Promise<string> => {
    const suffix = file.name.split('.').pop()?.toLowerCase() || 'png';
    const id = nanoid();
    const newName = `${id}.${suffix}`;
    const key = `user-files/output-images/${newName}`;

    // 获取 S3 配置
    const configRes = await fetch('/api/medias/s3/configs');
    const configData = await configRes.json();
    const config = configData?.data;

    let uploadUrl: string;

    if (config.proxy) {
      // 使用代理上传
      const formData = new FormData();
      formData.append('key', key);
      formData.append('file', file);
      const res = await fetch('/api/medias/s3/file', { method: 'POST', body: formData });
      const data = await res.json();
      uploadUrl = data?.data ?? config.baseUrl + key;
    } else {
      // 使用预签名 URL 上传
      const presignRes = await fetch(`/api/medias/s3/presign?key=${key}`);
      const presignData = await presignRes.json();
      const presignedUrl = presignData?.data;
      await fetch(presignedUrl, { method: 'PUT', body: file });
      uploadUrl = config.baseUrl + key;
    }

    // 创建媒体文件记录
    await createMediaFile({
      type: file.type as VinesResourceType,
      md5: '',
      displayName: file.name,
      source: VinesResourceSource.UPLOAD,
      url: uploadUrl,
      tags: [],
      categoryIds: [],
      size: file.size,
    });

    return uploadUrl;
  };

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.currentTarget.files;
      if (files && files.length > 0) {
        const file = files[0];
        if (file.type.startsWith('image/')) {
          setIsUploading(true);
          try {
            const url = await uploadFile(file);
            onReplace(index, url);
          } catch (error) {
            console.error('Upload failed:', error);
          } finally {
            setIsUploading(false);
          }
        }
      }
      e.currentTarget.value = '';
    },
    [index, onReplace],
  );

  const handleClick = useCallback(() => {
    if (!isUploading) {
      fileInputRef.current?.click();
    }
  }, [isUploading]);

  return (
    <div
      style={{ position: 'relative', borderRadius: '4px', overflow: 'hidden' }}
      onMouseEnter={() => setIsHover(true)}
      onMouseLeave={() => setIsHover(false)}
    >
      <img
        src={imageUrl}
        alt={`Output_${index + 1}`}
        style={{
          width: '100%',
          maxHeight: '150px',
          objectFit: 'contain',
          borderRadius: '4px',
          backgroundColor: '#F3F4F6',
          opacity: isUploading ? 0.5 : 1,
        }}
      />

      {/* 悬浮遮罩 - 点击替换 */}
      {(isHover || isUploading) && (
        <div
          onPointerDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleClick();
          }}
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: isUploading ? 'wait' : 'pointer',
            borderRadius: '4px',
          }}
        >
          {isUploading ? (
            <>
              <Loader2 size={24} style={{ color: 'white', marginBottom: '4px', animation: 'spin 1s linear infinite' }} />
              <div style={{ fontSize: '11px', color: 'white' }}>上传中...</div>
            </>
          ) : (
            <>
              <ImagePlus size={24} style={{ color: 'white', marginBottom: '4px' }} />
              <div style={{ fontSize: '11px', color: 'white' }}>点击替换图片</div>
            </>
          )}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export class OutputShapeUtil extends BaseBoxShapeUtil<OutputShape> {
  static override type = 'output' as const;

  override isAspectRatioLocked = (_shape: OutputShape) => false;
  override canResize = (_shape: OutputShape) => true;
  override canBind = () => true;
  override canEdit = () => true;

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
        }),
    );
    const width = Math.max(shape.props.w || 300, 1);
    const height = Math.max(shape.props.h || 200, 1);
    const bodyGeometry = new Rectangle2d({ width, height, isFilled: true });
    return new Group2d({ children: [bodyGeometry, ...portGeometries] });
  }

  component(shape: OutputShape) {
    const bounds = this.editor.getShapeGeometry(shape).bounds;
    const isEditing = this.editor.getEditingShapeId() === shape.id;
    return (
      <HTMLContainer
        id={shape.id}
        style={{ width: bounds.width, height: bounds.height, pointerEvents: 'all', userSelect: 'none' }}
      >
        <OutputShapeComponent shape={shape} editor={this.editor} isEditing={isEditing} />
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


function OutputShapeComponent({
  shape,
  editor,
  isEditing,
}: {
  shape: OutputShape;
  editor: Editor;
  isEditing: boolean;
}) {
  // 获取图片列表
  const getImages = useCallback(() => {
    const imgs = (Array.isArray(shape.props.images) ? shape.props.images : []).filter(
      (it) => typeof it === 'string' && it.length > 0,
    );
    if (imgs.length === 0 && shape.props.imageUrl && shape.props.imageUrl.length > 0) {
      return [shape.props.imageUrl];
    }
    return imgs;
  }, [shape.props.images, shape.props.imageUrl]);

  const images = getImages();
  const hasImages = images.length > 0;
  const hasContent = shape.props.content && shape.props.content.length > 0;
  const isEmpty = !hasImages && !hasContent;

  // 切换编辑模式
  const toggleEditMode = useCallback(() => {
    if (isEditing) {
      editor.setEditingShape(null);
    } else {
      editor.setEditingShape(shape.id);
    }
  }, [editor, shape.id, isEditing]);

  // 处理内容变化
  const handleContentChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const currentShape = editor.getShape<OutputShape>(shape.id);
      if (!currentShape) return;
      editor.updateShape<OutputShape>({
        id: shape.id,
        type: 'output',
        props: { ...currentShape.props, content: e.target.value },
      });
    },
    [editor, shape.id],
  );

  // 替换指定位置的图片
  const handleReplaceImage = useCallback(
    (index: number, newUrl: string) => {
      const currentShape = editor.getShape<OutputShape>(shape.id);
      if (!currentShape) return;
      let currentImages: string[] = [];
      if (Array.isArray(currentShape.props.images) && currentShape.props.images.length > 0) {
        currentImages = [...currentShape.props.images];
      } else if (currentShape.props.imageUrl) {
        currentImages = [currentShape.props.imageUrl];
      }
      currentImages[index] = newUrl;
      editor.updateShape<OutputShape>({
        id: shape.id,
        type: 'output',
        props: {
          ...currentShape.props,
          images: currentImages,
          imageUrl: currentImages.length > 0 ? currentImages[0] : '',
        },
      });
    },
    [editor, shape.id],
  );

  // 从内容中提取图片
  const extractImageUrlsFromContent = (content: string): string[] => {
    if (!content) return [];
    const urls = new Set<string>();
    for (const m of content.matchAll(/!\[[^\]]*]\((https?:\/\/[^\s)]+)\)/gi)) urls.add(m[1]);
    for (const m of content.matchAll(/\[[^\]]*]\((https?:\/\/[^\s)]+)\)/gi)) {
      if (/\.(png|jpe?g|webp|gif|bmp|svg)(\?.*)?$/i.test(m[1])) urls.add(m[1]);
    }
    for (const m of content.matchAll(/<img[^>]+src=["'](https?:\/\/[^"']+)["'][^>]*>/gi)) urls.add(m[1]);
    for (const m of content.matchAll(/https?:\/\/[^\s"'')]+/gi)) {
      if (/\.(png|jpe?g|webp|gif|bmp|svg)(\?.*)?$/i.test(m[0])) urls.add(m[0]);
    }
    return Array.from(urls);
  };

  const derivedImages = !hasImages && hasContent ? extractImageUrlsFromContent(shape.props.content) : [];
  const imagesToShow = hasImages ? images : derivedImages;
  const showImages = imagesToShow.length > 0;

  // 检测 markdown
  const isMarkdown = (text: string): boolean => {
    if (!text) return false;
    const patterns = [
      /^#{1,6}\s+.+$/m,
      /\*\*.*?\*\*/,
      /`.*?`/,
      /```[\s\S]*?```/,
      /^[-*+]\s+.+$/m,
      /\[.*?\]\(.*?\)/,
      /^>\s+.+$/m,
    ];
    return patterns.some((p) => p.test(text));
  };

  const contentIsMarkdown = hasContent && isMarkdown(shape.props.content);

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        border: isEditing ? '2px solid #3B82F6' : '2px solid #059669',
        borderRadius: '8px',
        backgroundColor: 'white',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: isEditing ? '0 0 0 2px rgba(59, 130, 246, 0.3)' : '0 2px 8px rgba(0,0,0,0.1)',
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
          backgroundColor: isEditing ? '#EFF6FF' : '#F0FDF4',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px', width: '12px', height: '12px' }}>
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                style={{
                  width: '4px',
                  height: '4px',
                  backgroundColor: isEditing ? '#3B82F6' : '#059669',
                  borderRadius: '50%',
                }}
              />
            ))}
          </div>
          <span style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>
            Output {isEditing && '(编辑中)'}
          </span>
        </div>

        {/* 编辑按钮 */}
        <button
          disabled={isEmpty}
          onPointerDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!isEmpty) toggleEditMode();
          }}
          style={{
            width: '24px',
            height: '24px',
            border: 'none',
            backgroundColor: isEmpty ? '#F3F4F6' : isEditing ? '#3B82F6' : '#E5E7EB',
            color: isEmpty ? '#D1D5DB' : isEditing ? 'white' : '#6B7280',
            borderRadius: '4px',
            cursor: isEmpty ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: isEmpty ? 0.6 : 1,
          }}
          title={isEmpty ? '无内容可编辑' : isEditing ? '完成' : '编辑'}
        >
          {isEditing ? <Eye size={14} /> : <Edit3 size={14} />}
        </button>
      </div>

      {/* 内容区域 */}
      <div style={{ flex: 1, padding: '12px', overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
        {/* 空状态 */}
        {isEmpty && !isEditing && (
          <div
            style={{
              flex: 1,
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

        {/* 编辑模式 */}
        {isEditing ? (
          <>
            {/* 图片编辑区域 */}
            {showImages && (
              <div
                style={{
                  marginBottom: hasContent ? '12px' : 0,
                  display: 'grid',
                  gridTemplateColumns: imagesToShow.length > 1 ? 'repeat(2, 1fr)' : '1fr',
                  gap: '8px',
                }}
              >
                {imagesToShow.map((url, idx) => (
                  <ImageReplaceZone
                    key={`edit_${idx}`}
                    imageUrl={url}
                    index={idx}
                    onReplace={handleReplaceImage}
                  />
                ))}
              </div>
            )}

            {/* 文本编辑区域 */}
            {hasContent && (
              <textarea
                value={shape.props.content}
                onChange={handleContentChange}
                onPointerDown={(e) => e.stopPropagation()}
                placeholder="输入内容，支持 Markdown..."
                style={{
                  flex: 1,
                  minHeight: '80px',
                  border: '1px solid #E5E7EB',
                  borderRadius: '4px',
                  outline: 'none',
                  resize: 'none',
                  fontSize: '14px',
                  fontFamily: 'ui-monospace, monospace',
                  color: '#374151',
                  backgroundColor: '#FAFAFA',
                  padding: '8px',
                  lineHeight: '1.5',
                }}
              />
            )}
          </>
        ) : (
          /* 预览模式 */
          <>
            {showImages && (
              <div
                style={{
                  marginBottom: hasContent ? '12px' : 0,
                  display: 'grid',
                  gridTemplateColumns: '1fr',
                  gap: '8px',
                }}
              >
                {imagesToShow.map((url, idx) => (
                  <img
                    key={`view_${idx}`}
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

            {hasContent && (
              <div style={{ fontSize: '14px', color: '#374151', lineHeight: '1.5', wordBreak: 'break-word' }}>
                {contentIsMarkdown ? (
                  <VinesMarkdown className="prose prose-sm max-w-none">{shape.props.content}</VinesMarkdown>
                ) : (
                  <div style={{ whiteSpace: 'pre-wrap' }}>{shape.props.content}</div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      <GenericPort shapeId={shape.id} portId="input" />
      <GenericPort shapeId={shape.id} portId="output" />
    </div>
  );
}
