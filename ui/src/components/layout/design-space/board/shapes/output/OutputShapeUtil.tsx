import React, { useCallback, useEffect, useRef, useState } from 'react';

import { OrbitControls } from '@react-three/drei';
import { Canvas, useThree } from '@react-three/fiber';
import { Edit3, Eye, ImagePlus, Loader2 } from 'lucide-react';
import { nanoid } from 'nanoid';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { BaseBoxShapeUtil, Circle2d, Editor, Group2d, HTMLContainer, Rectangle2d, resizeBox } from 'tldraw';

import { useSystemConfig } from '@/apis/common';
import { createMediaFile } from '@/apis/resources';
import { VinesResourceSource, VinesResourceType } from '@/apis/resources/typting.ts';
import { VinesMarkdown } from '@/components/ui/markdown';

import { OutputShape } from '../instruction/InstructionShape.types';
import { GenericPort } from '../ports/GenericPort';
import { getOutputPorts } from '../ports/shapePorts';

const PORT_RADIUS_PX = 8;

const MODEL_URL_REGEX = /(https?:\/\/[^\s)]+?\.(?:glb|gltf|usdz|fbx|obj)(?:\?[^\s)]+)?)/i;

const extractModelUrl = (content: string): string | null => {
  if (!content) return null;
  const prefixed = content.match(/3d模型\s*url[:：]\s*(https?:\/\/\S+)/i);
  if (prefixed?.[1]) {
    return prefixed[1].trim();
  }
  const matched = content.match(MODEL_URL_REGEX);
  return matched?.[1]?.trim() ?? null;
};

const stripModelUrlFromContent = (content: string): string => {
  if (!content) return '';
  // 去掉“3D模型url: xxx” 或单独的 glb/gltf 等链接，保留其他文本
  const removed = content
    .replace(/3d模型\s*url[:：]?\s*https?:\/\/\S+/gi, '')
    .replace(MODEL_URL_REGEX, '')
    .replace(/^\s*[\r\n]/gm, ''); // 去掉留下的空行
  return removed.trim();
};

function GLBModel({
  url,
  onLoaded,
  onError,
}: {
  url: string;
  onLoaded: () => void;
  onError: (message: string) => void;
}) {
  const [model, setModel] = useState<THREE.Group | null>(null);
  const groupRef = useRef<THREE.Group>(null);
  const { camera } = useThree();

  useEffect(() => {
    let cancelled = false;
    setModel(null);
    const loader = new GLTFLoader();

    loader.load(
      url,
      (gltf) => {
        if (cancelled) return;
        const scene = (gltf as any).scene || (gltf as any).scenes?.[0];
        if (!scene) {
          onError('模型为空');
          return;
        }
        setModel(scene.clone(true));
        onLoaded();
      },
      undefined,
      (error) => {
        if (cancelled) return;
        console.error('3D model load failed', error);
        onError('模型加载失败');
      },
    );

    return () => {
      cancelled = true;
    };
  }, [url, onError, onLoaded]);

  useEffect(() => {
    if (!model || !groupRef.current) return;
    const box = new THREE.Box3().setFromObject(groupRef.current);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    const distance = maxDim * 1.8;
    const scale = 2 / maxDim;

    groupRef.current.position.set(-center.x, -center.y, -center.z);
    groupRef.current.scale.setScalar(scale);
    camera.position.set(center.x + distance, center.y + distance, center.z + distance);
    camera.lookAt(0, 0, 0);
  }, [model, camera]);

  if (!model) return null;

  return (
    // eslint-disable-next-line react/no-unknown-property
    <primitive ref={groupRef} object={model} />
  );
}

function ModelViewer3D({ url }: { url: string }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const stopScroll = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    // 避免画布跟随滚动，同时允许 3D 视图缩放
    e.preventDefault();
    e.stopPropagation();
  }, []);

  useEffect(() => {
    setLoading(true);
    setError(null);
  }, [url]);

  const handleLoaded = useCallback(() => {
    setLoading(false);
  }, []);

  const handleError = useCallback((message: string) => {
    setError(message);
    setLoading(false);
  }, []);

  return (
    <div
      style={{
        width: '100%',
        height: '240px',
        border: '1px solid #E5E7EB',
        borderRadius: '6px',
        backgroundColor: '#F8FAFC',
        overflow: 'hidden',
        position: 'relative',
        overscrollBehavior: 'contain',
      }}
      onPointerDown={(e) => {
        e.stopPropagation();
      }}
      onWheel={stopScroll}
      onWheelCapture={stopScroll}
    >
      <Canvas camera={{ position: [0, 0, 3], fov: 50 }} style={{ width: '100%', height: '100%' }}>
        {/* eslint-disable-next-line react/no-unknown-property */}
        <color attach="background" args={['#F8FAFC']} />
        {/* eslint-disable-next-line react/no-unknown-property */}
        <ambientLight intensity={0.8} />
        {/* eslint-disable-next-line react/no-unknown-property */}
        <directionalLight position={[4, 4, 4]} intensity={0.9} />
        {/* eslint-disable-next-line react/no-unknown-property */}
        <directionalLight position={[-4, 2, -4]} intensity={0.5} />
        <OrbitControls enableDamping dampingFactor={0.08} enablePan enableZoom />
        <GLBModel url={url} onLoaded={handleLoaded} onError={handleError} />
      </Canvas>

      {(loading || error) && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: 'rgba(248, 250, 252, 0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '13px',
            color: '#4B5563',
            pointerEvents: 'none',
          }}
        >
          {error ?? '模型加载中...'}
        </div>
      )}
    </div>
  );
}

// 媒体替换组件 - 支持点击上传替换（图片或视频）
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
  
  // 检测是否是视频
  const isVideo = /\.(mp4|webm|mov|avi)(\?.*)?$/i.test(imageUrl);

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
        // 支持图片和视频
        if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
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
      {isVideo ? (
        <video
          src={imageUrl}
          controls
          style={{
            width: '100%',
            maxHeight: '150px',
            objectFit: 'contain',
            borderRadius: '4px',
            backgroundColor: '#F3F4F6',
            opacity: isUploading ? 0.5 : 1,
          }}
        />
      ) : (
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
      )}

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
        accept="image/*,video/*"
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
      generatedTime: 0,
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
  // 获取 OEM 配置
  const { data: oemConfig } = useSystemConfig();
  const showGeneratedTime = oemConfig?.theme?.id === 'concept-design'; // 只在国重环境显示

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
  const rawContent = shape.props.content || '';
  const modelUrl = extractModelUrl(shape.props.content);
  const is3DModel = Boolean(modelUrl);
  const cleanedContent = is3DModel ? stripModelUrlFromContent(rawContent) : rawContent;
  const hasContent = cleanedContent.length > 0;
  const isEmpty = !hasImages && !hasContent && !is3DModel;
  const canEdit = !is3DModel && !isEmpty;
  const effectiveEditing = isEditing && canEdit;

  useEffect(() => {
    if (!canEdit && isEditing) {
      editor.setEditingShape(null);
    }
  }, [canEdit, editor, isEditing]);

  // 切换编辑模式
  const toggleEditMode = useCallback(() => {
    if (!canEdit) return;
    if (isEditing) {
      editor.setEditingShape(null);
    } else {
      editor.setEditingShape(shape.id);
    }
  }, [canEdit, editor, shape.id, isEditing]);

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
        border: effectiveEditing ? '2px solid #3B82F6' : '2px solid #059669',
        borderRadius: '8px',
        backgroundColor: 'white',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: effectiveEditing ? '0 0 0 2px rgba(59, 130, 246, 0.3)' : '0 2px 8px rgba(0,0,0,0.1)',
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
          backgroundColor: effectiveEditing ? '#EFF6FF' : '#F0FDF4',
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
                  backgroundColor: effectiveEditing ? '#3B82F6' : '#059669',
                  borderRadius: '50%',
                }}
              />
            ))}
          </div>
          <span style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>
            输出 {effectiveEditing && '(编辑中)'}
          </span>
        </div>

        {/* 编辑按钮 */}
        <button
          disabled={!canEdit}
          onPointerDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (canEdit) toggleEditMode();
          }}
          style={{
            width: '24px',
            height: '24px',
            border: 'none',
            backgroundColor: !canEdit ? '#F3F4F6' : effectiveEditing ? '#3B82F6' : '#E5E7EB',
            color: !canEdit ? '#D1D5DB' : effectiveEditing ? 'white' : '#6B7280',
            borderRadius: '4px',
            cursor: !canEdit ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: !canEdit ? 0.6 : 1,
          }}
          title={
            !canEdit
              ? is3DModel
                ? '3D 模型展示暂不支持编辑'
                : '无内容可编辑'
              : effectiveEditing
                ? '完成'
                : '编辑'
          }
        >
          {effectiveEditing ? <Eye size={14} /> : <Edit3 size={14} />}
        </button>
      </div>

      {/* 内容区域 */}
      <div
        style={{ flex: 1, padding: '12px', overflow: 'auto', display: 'flex', flexDirection: 'column' }}
        // 防止在内容区域滚动 / 拖动滚动条时触发画布上的拖拽（移动整个 Output 框）
        onPointerDown={(e) => {
          e.stopPropagation();
        }}
      >
        {/* 空状态 */}
        {isEmpty && !effectiveEditing && (
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
        {effectiveEditing ? (
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
            {is3DModel && modelUrl && (
              <div
                style={{
                  marginBottom: showImages || hasContent ? '12px' : 0,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
                onPointerDown={(e) => e.stopPropagation()}
              >
                <ModelViewer3D url={modelUrl} />
                <div style={{ fontSize: '13px', color: '#4B5563', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 600 }}>3D 模型</span>
                  <a
                    href={modelUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: '#2563EB', wordBreak: 'break-all' }}
                  >
                    {modelUrl}
                  </a>
                </div>
              </div>
            )}

            {showImages && (
              <div
                style={{
                  marginBottom: hasContent ? '12px' : 0,
                  display: 'grid',
                  gridTemplateColumns: '1fr',
                  gap: '8px',
                }}
              >
                {imagesToShow.map((url, idx) => {
                  // 检测是否是视频
                  const isVideo = /\.(mp4|webm|mov|avi)(\?.*)?$/i.test(url);
                  
                  if (isVideo) {
                    return (
                      <video
                        key={`view_${idx}`}
                        src={url}
                        controls
                        style={{
                          maxWidth: '100%',
                          maxHeight: hasContent ? '200px' : '100%',
                          objectFit: 'contain',
                          borderRadius: '4px',
                        }}
                      />
                    );
                  }
                  
                  return (
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
                  );
                })}
              </div>
            )}

            {hasContent && (
              <div style={{ fontSize: '14px', color: '#374151', lineHeight: '1.5', wordBreak: 'break-word' }}>
                {contentIsMarkdown ? (
                  <VinesMarkdown className="prose prose-sm max-w-none">{cleanedContent}</VinesMarkdown>
                ) : (
                  <div style={{ whiteSpace: 'pre-wrap' }}>{cleanedContent}</div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* 生成时间标签 - 右下角（只在有图片/视频且有有效耗时时显示） */}
      {showGeneratedTime &&
        shape.props.generatedTime > 0 &&
        ((shape.props.images && shape.props.images.length > 0) || shape.props.imageUrl) && (
        <div
          style={{
            position: 'absolute',
            bottom: '8px',
            right: '8px',
            fontSize: '10px',
            color: '#6B7280',
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            padding: '2px 6px',
            borderRadius: '4px',
            border: '1px solid #E5E7EB',
            fontFamily: 'monospace',
            pointerEvents: 'none',
            zIndex: 10,
          }}
        >
          {(() => {
            const ms = shape.props.generatedTime;
            // 小于 1 秒，显示毫秒
            if (ms < 1000) {
              return `${ms}ms`;
            }
            // 小于 1 分钟，显示秒（保留 2 位小数）
            if (ms < 60000) {
              return `${(ms / 1000).toFixed(2)}s`;
            }
            // 小于 1 小时，显示 分:秒
            if (ms < 3600000) {
              const minutes = Math.floor(ms / 60000);
              const seconds = ((ms % 60000) / 1000).toFixed(0);
              return `${minutes}m ${seconds}s`;
            }
            // 大于 1 小时，显示 时:分:秒
            const hours = Math.floor(ms / 3600000);
            const minutes = Math.floor((ms % 3600000) / 60000);
            const seconds = ((ms % 60000) / 1000).toFixed(0);
            return `${hours}h ${minutes}m ${seconds}s`;
          })()}
        </div>
      )}

      <GenericPort shapeId={shape.id} portId="input" />
      <GenericPort shapeId={shape.id} portId="output" />
    </div>
  );
}
