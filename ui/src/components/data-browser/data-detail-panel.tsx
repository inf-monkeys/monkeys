import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MediaPreview } from '@/components/ui/media-preview';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import type { DataItem } from '@/types/data';
import type { MonkeyWorkflow, ToolProperty } from '@inf-monkeys/monkeys';
import { useNavigate } from '@tanstack/react-router';
import { format } from 'date-fns';
import {
  ArrowLeft,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  File,
  FileText,
  FolderOpen,
  Image as ImageIcon,
  Tag,
  User,
  Video,
} from 'lucide-react';
import { startTransition, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { useWorkspacePages } from '@/apis/pages';
import { getWorkflow } from '@/apis/workflow';
import { StepThumbnailGenerator } from '@/components/layout/ugc/step-thumbnail-generator';
import { useVinesTeam } from '@/components/router/guard/team';
import { useVinesRoute } from '@/components/router/use-vines-route';
import { useSetCurrentPage } from '@/store/useCurrentPageStore';
import { useSetWorkbenchCacheVal } from '@/store/workbenchFormInputsCacheStore';
import { getI18nContent } from '@/utils';
import { getTargetInput } from '@/utils/association';

const CONVERSION_FUNCTION_VALUES = ['text', 'image', 'symbol-summary', '3d-model', 'neural-model'] as const;
type ConversionType = (typeof CONVERSION_FUNCTION_VALUES)[number];

const TEXT_WORKFLOW = {
  workflowId: '6901e37ea5296be427f9ccab',
  pageId: '6901e37f87f27c8355da8e2d',
} as const;

const IMAGE_WORKFLOW = {
  workflowId: '6901d6a98e22439dfb12743a',
  pageId: '6901d6ab22a4acef6c94370c',
} as const;

const normalizeAcceptList = (accept: unknown): string[] => {
  if (typeof accept !== 'string') return [];
  return accept
    .split(',')
    .map((it) => it.trim().replace(/^\./, '').toLowerCase())
    .filter(Boolean);
};

const isImageFileVariable = (variable?: ToolProperty): boolean => {
  if (!variable) return false;
  if (variable.type !== 'file') return false;
  const acceptList = normalizeAcceptList(variable.typeOptions?.accept);
  if (!acceptList.length) return true;
  return acceptList.some(
    (it) =>
      it.includes('image/') || ['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp', 'tiff', 'svg'].includes(it.replace(/^\./, '')),
  );
};

const is3DFileUrl = (url: string | undefined): boolean => {
  if (!url) return false;
  const u = url.toLowerCase();
  return /\.(step|stp|glb|gltf|obj|fbx|stl)(\?|#|$)/.test(u);
};

const findConversionFunctionVar = (workflow?: MonkeyWorkflow): ToolProperty | undefined => {
  const vars = workflow?.variables ?? [];
  const CN_MAP: Record<ConversionType, string> = {
    text: '文本',
    image: '图片',
    'symbol-summary': '符号概括',
    '3d-model': '3D模型',
    'neural-model': '神经模型',
  };

  const norm = (val: unknown) =>
    String(val ?? '')
      .trim()
      .toLowerCase()
      .replace(/[\s\-_]/g, '');

  const hasConversionSelectValues = (v: ToolProperty) => {
    const selectList = (v.typeOptions as any)?.selectList;
    if (!Array.isArray(selectList)) return false;
    const values = selectList.map((it: any) => String(it?.value ?? '')).filter(Boolean);
    const labels = selectList
      .map((it: any) => {
        const label = it?.label ?? it?.displayName ?? it?.name ?? it?.text ?? it?.title;
        return String(getI18nContent(label) ?? label ?? '');
      })
      .filter(Boolean);

    const hasInternal = CONVERSION_FUNCTION_VALUES.some((x) => values.includes(x) || labels.includes(x));
    const hasCN = Object.values(CN_MAP).some((x) => values.includes(x) || labels.includes(x));
    const hasFuzzy =
      CONVERSION_FUNCTION_VALUES.some((x) => values.some((v) => norm(v) === norm(x)) || labels.some((l) => norm(l) === norm(x))) ||
      Object.values(CN_MAP).some((x) => values.some((v) => norm(v) === norm(x)) || labels.some((l) => norm(l) === norm(x)));
    return hasInternal || hasCN;
  };

  // Prefer select list variable that contains our values (internal or CN)
  for (const v of vars) {
    if (v.type !== 'string') continue;
    if (hasConversionSelectValues(v)) return v;
  }
  // Fallback by label/name matching
  const byName = vars.find((v) => {
    if (v.type !== 'string') return false;
    const name = String(v.name ?? '');
    const label = String(getI18nContent((v as any).displayName) ?? '');
    return /convert|conversion|function/i.test(name) || /转换功能/.test(label);
  });
  return byName as any;
};

const resolveConversionValueForVar = (variable: ToolProperty | undefined, conversionType: ConversionType): string => {
  if (!variable) return conversionType;
  const selectList = (variable.typeOptions as any)?.selectList;
  if (!Array.isArray(selectList) || !selectList.length) return conversionType;
  const values = selectList.map((it: any) => String(it?.value ?? '')).filter(Boolean);
  const norm = (val: unknown) =>
    String(val ?? '')
      .trim()
      .toLowerCase()
      .replace(/[\s\-_]/g, '');

  // 1) internal values
  if (values.includes(conversionType)) return conversionType;

  // 2) CN values
  const cnMap: Record<ConversionType, string> = {
    text: '文本',
    image: '图片',
    'symbol-summary': '符号概括',
    '3d-model': '3D模型',
    'neural-model': '神经模型',
  };
  const cn = cnMap[conversionType];
  if (values.includes(cn)) return cn;

  // 3) match by label/displayName -> return the underlying value
  const targets = [conversionType, cn].filter(Boolean).map(norm);
  const synonyms: Partial<Record<ConversionType, string[]>> = {
    '3d-model': ['3d', '3d模型', '3dmodel', '3d-model', '3d model'],
    'symbol-summary': ['符号概述', '符号总结', 'symbolsummary', 'symbol summary'],
    'neural-model': ['神经网络模型', 'neuralmodel', 'neural model'],
  };
  for (const s of (synonyms[conversionType] ?? [])) targets.push(norm(s));

  for (const it of selectList as any[]) {
    const rawVal = String(it?.value ?? '');
    const rawLabelSource = it?.label ?? it?.displayName ?? it?.name ?? it?.text ?? it?.title;
    const rawLabel = String(getI18nContent(rawLabelSource) ?? rawLabelSource ?? '');
    if (targets.includes(norm(rawVal)) || targets.includes(norm(rawLabel))) {
      return rawVal || rawLabel;
    }
  }

  // 4) loose match by value list
  const idx = values.findIndex((v) => norm(v) === norm(conversionType));
  if (idx >= 0) return values[idx];

  return conversionType;
};

const findTextInputVarName = (workflow?: MonkeyWorkflow, exclude?: string): string | undefined => {
  const vars = workflow?.variables ?? [];
  const candidates = vars.filter((v) => v.type === 'string' && v.name !== exclude);
  const best =
    candidates.find((v) => /text|prompt|content/i.test(v.name)) ??
    candidates.find((v) => /文本/.test(String(getI18nContent((v as any).displayName) ?? ''))) ??
    candidates[0];
  return best?.name;
};

const findImageInputVarName = (workflow?: MonkeyWorkflow, exclude?: string): string | undefined => {
  const vars = workflow?.variables ?? [];
  const candidates = vars.filter((v) => v.name !== exclude);
  const best = candidates.find((v) => isImageFileVariable(v as any));
  return best?.name;
};

/**
 * 检测是否是文本文件
 */
function isTextFile(url?: string | null): boolean {
  if (!url || typeof url !== 'string') return false;
  const lowerUrl = url.toLowerCase();
  return !!lowerUrl.match(/\.(txt|md|csv|json|xml|log|conf|ini|yaml|yml)$/);
}

interface DataDetailPanelProps {
  item: DataItem | null;
  onBack: () => void;
}

export function DataDetailPanel({ item, onBack }: DataDetailPanelProps) {
  const previewJsonRef = useRef<HTMLPreElement>(null);
  const metadataJsonRef = useRef<HTMLPreElement>(null);
  const navigate = useNavigate();
  const { teamId } = useVinesTeam();
  const setWorkbenchCacheVal = useSetWorkbenchCacheVal();
  const setCurrentPage = useSetCurrentPage();
  const { isUseWorkbench } = useVinesRoute();
  const { data: workspaceData } = useWorkspacePages();

  // 多图轮播状态
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // 文本文件内容状态
  const [textContent, setTextContent] = useState<string>('');
  const [isLoadingText, setIsLoadingText] = useState(false);
  const [textError, setTextError] = useState<string>('');

  if (!item) return null;

  // 获取图片数组
  const getMediaArray = (): string[] => {
    if (Array.isArray(item.media)) {
      return item.media;
    }
    if (item.media) {
      return [item.media];
    }
    if (item.thumbnail) {
      return [item.thumbnail];
    }
    return [];
  };

  const mediaArray = getMediaArray();
  const hasMultipleImages = mediaArray.length > 1;
  const currentMedia = mediaArray[currentImageIndex] || mediaArray[0];
  const primary: any = (item as any)?.primaryContent ?? null;
  const primaryType = primary?.type as string | undefined;
  const primaryValue = primary?.value as string | undefined;
  const primaryUrl = primary?.url as string | undefined; // 兼容：某些数据用 primaryContent.url

  const is3DSource =
    (item as any)?.assetType === '3d' ||
    primaryType === '3d' ||
    is3DFileUrl(primaryValue) ||
    is3DFileUrl(primaryUrl) ||
    is3DFileUrl(currentMedia);

  const isTextSource =
    (item as any)?.assetType === 'text' ||
    primaryType === 'text' ||
    isTextFile(primaryValue) ||
    isTextFile(primaryUrl) ||
    isTextFile(currentMedia);

  // 兼容旧逻辑：后面一些 UI/逻辑仍然用 isText
  const isText = isTextSource;
  const sourceLabel = isTextSource ? '文本' : is3DSource ? '3D模型' : '图片';

  // 文本源可能是“内联文本”或“文本文件 URL”
  const pickFirstUrl = (...candidates: Array<string | undefined>) => candidates.find((v) => typeof v === 'string' && /^https?:\/\//i.test(v));
  const textUrlForFetch =
    isTextSource &&
    (isTextFile(primaryUrl)
      ? primaryUrl
      : isTextFile(primaryValue)
        ? primaryValue
        : isTextFile(currentMedia)
          ? currentMedia
          : // 没有后缀也允许（既然已判定是文本源，就尝试拉取）
            pickFirstUrl(primaryUrl, primaryValue, currentMedia));

  const inlineTextValue =
    isTextSource && typeof primaryValue === 'string' && !/^https?:\/\//i.test(primaryValue) && !isTextFile(primaryValue) ? primaryValue : '';

  const modelUrlFor3D = is3DSource ? (primaryValue || primaryUrl || currentMedia) : '';
  const imageUrlForImage = !isTextSource && !is3DSource ? (currentMedia || primaryUrl || primaryValue) : '';
  // 文本兜底：有些“知识资源库/文本”资产，primaryContent 可能是结构化对象而不是 {type,value}
  const primaryObjectText =
    isTextSource &&
    primary &&
    typeof primary === 'object' &&
    !Array.isArray(primary) &&
    !primaryValue &&
    !primaryUrl
      ? JSON.stringify(primary, null, 2)
      : '';
  const propertiesObjectText =
    isTextSource &&
    (item as any)?.properties &&
    typeof (item as any).properties === 'object' &&
    !Array.isArray((item as any).properties)
      ? JSON.stringify((item as any).properties, null, 2)
      : '';

  const textPayloadCandidate = isTextSource
    ? String(inlineTextValue || textContent || primaryValue || primaryUrl || primaryObjectText || propertiesObjectText || currentMedia || '').trim()
    : '';

  // 转换 UI（先对齐团队资产的样式；功能后续接入）
  const [conversionType, setConversionType] = useState<ConversionType>('text');
  useEffect(() => {
    // 对齐团队资产：图片/3D 默认转文本；文本默认转图片
    setConversionType(isTextSource ? 'image' : 'text');
  }, [isText]);

  // 3D 截图：复用团队资产 StepThumbnailGenerator
  const [pending3DScreenshot, setPending3DScreenshot] = useState<{ url: string; name: string } | null>(null);
  const screenshotResolverRef = useRef<(blob: Blob | null) => void>();

  const uploadBlobForUrl = async (blob: Blob, fileName: string): Promise<string> => {
    const form = new FormData();
    form.append('file', blob, fileName);
    form.append('key', `step-thumbnails/${Date.now()}_${fileName}`);
    const res = await fetch('/api/medias/s3/file', { method: 'POST', body: form });
    const json = await res.json();
    const url = json?.data ?? json?.url;
    if (!url) throw new Error('upload failed');
    return url as string;
  };

  const capture3DScreenshotUrl = async (fileUrl: string, fileName: string): Promise<string> => {
    const blob = await new Promise<Blob | null>((resolve) => {
      screenshotResolverRef.current = resolve;
      setPending3DScreenshot({ url: fileUrl, name: fileName });
    });
    screenshotResolverRef.current = undefined;
    setPending3DScreenshot(null);
    if (!blob) throw new Error('3D截图生成失败');
    const screenshotName = `${fileName.replace(/\.[^.]+$/, '')}_screenshot.png`;
    return await uploadBlobForUrl(blob, screenshotName);
  };

  const handleStartConversion = async () => {
    // 1) 选择目标工作流（固定）
    const target = isTextSource ? TEXT_WORKFLOW : IMAGE_WORKFLOW;
    const workflowId = target.workflowId;
    const pageId = target.pageId;

    // 2) 获取源数据（文本/图片/3D截图）
    let payload: string = '';

    if (isTextSource) {
      if (textUrlForFetch && isLoadingText) {
        toast.error('文本内容加载中，请稍后再试');
        return;
      }
      // 即使加载失败也允许继续（用 URL/原值兜底），避免按钮一直置灰
      if (textUrlForFetch && textError) {
        toast.warning(`文本内容加载失败，使用原始值继续：${textError}`);
      }

      payload = textPayloadCandidate;
      if (!payload) {
        toast.error('未获取到可用的文本内容');
        return;
      }
    } else {
      // 图片：使用当前预览图 URL；3D：优先使用 primaryContent.value/url（模型 URL）
      const url = is3DSource ? modelUrlFor3D : imageUrlForImage;
      if (!url) {
        toast.error(is3DSource ? '未获取到可用的 3D 模型地址' : '未获取到可用的图片地址');
        return;
      }
      if (is3DSource) {
        // 3D：先截图再跳转到图片工作流
        const baseName = String(item.name || item.displayName || 'model');
        const extMatch = /\.([a-z0-9]+)(\?|#|$)/i.exec(String(url));
        const ext = (extMatch?.[1] ?? 'step').toLowerCase();
        const fileName = `${baseName}.${ext}`;
        toast.message('正在生成 3D 截图...');
        payload = await capture3DScreenshotUrl(url, fileName);
      } else {
        payload = url;
      }
    }

    // 3) 预填“资源值 + 转换功能参数”，写入 workbench cache
    try {
      const wf = await getWorkflow(workflowId);
      const conversionVar = findConversionFunctionVar(wf);
      const conversionVarName = conversionVar?.name;
      const mappedConversionValue = resolveConversionValueForVar(conversionVar, conversionType);

      const inputVar = isTextSource
        ? findTextInputVarName(wf, conversionVarName)
        : findImageInputVarName(wf, conversionVarName);

      if (!inputVar) {
        toast.error('未能匹配到目标工作流的输入参数字段');
        return;
      }

      const originData: Record<string, any> = { __value: payload, __conversion: mappedConversionValue };
      const mapper = [{ origin: '__value', target: inputVar }];
      if (conversionVarName) mapper.push({ origin: '__conversion', target: conversionVarName });

      const targetInput = await getTargetInput({ workflowId, originData, mapper });
      setWorkbenchCacheVal(workflowId, targetInput);

      // 4) 跳转到“工作台（创新方法）”固定表单视图：优先通过 pinned pages 选中工作台页面
      if (workspaceData?.pages?.length && workspaceData?.groups?.length) {
        const targetPage =
          workspaceData.pages.find(
            (p) =>
              (p.id === pageId ||
                p.workflow?.workflowId === workflowId ||
                (p.workflow as any)?.id === workflowId) &&
              p.type === 'preview',
          ) ?? null;
        const targetGroup = targetPage
          ? workspaceData.groups.find((g) => g.pageIds.includes(targetPage.id))
          : undefined;

        if (targetPage && targetGroup) {
          startTransition(() => {
            setCurrentPage({ [teamId]: { ...targetPage, groupId: targetGroup.id } });
          });
          if (!isUseWorkbench) {
            void navigate({ to: '/$teamId', params: { teamId } });
          }
          return;
        }
      }

      // fallback：如果没有 pinned page，就跳到 workflow 的页面路由
      void navigate({ to: '/$teamId/workspace/$workflowId/$pageId', params: { teamId, workflowId, pageId } });
    } catch (e: any) {
      toast.error(`跳转失败：${e?.message ?? '未知错误'}`);
    }
  };

  // 加载文本文件内容
  useEffect(() => {
    if (textUrlForFetch) {
      setIsLoadingText(true);
      setTextError('');
      fetch(textUrlForFetch)
        .then(res => {
          if (!res.ok) throw new Error('Failed to load file');
          return res.text();
        })
        .then(content => {
          setTextContent(content);
          setIsLoadingText(false);
        })
        .catch(error => {
          setTextError(error.message || '加载文件失败');
          setIsLoadingText(false);
        });
    }
  }, [textUrlForFetch]);

  const handlePreviousImage = () => {
    setCurrentImageIndex((prev) =>
      prev > 0 ? prev - 1 : mediaArray.length - 1
    );
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) =>
      prev < mediaArray.length - 1 ? prev + 1 : 0
    );
  };

  const formatDate = (timestamp: string | number | undefined): string => {
    if (!timestamp) return '-';
    const ts = typeof timestamp === 'string' ? parseInt(timestamp, 10) : timestamp;
    if (isNaN(ts)) return '-';
    const date = new Date(ts);
    if (isNaN(date.getTime())) return '-';
    return format(date, 'yyyy-MM-dd HH:mm:ss');
  };

  const formatFileSize = (bytes: number | undefined): string => {
    if (!bytes) return '-';
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const getStatusLabel = (status: string | undefined): string => {
    if (!status) return '-';
    const labels: Record<string, string> = {
      published: '已发布',
      draft: '草稿',
      archived: '已归档',
    };
    return labels[status] || status;
  };

  const getStatusVariant = (
    status: string | undefined
  ): 'default' | 'secondary' | 'outline' => {
    if (!status) return 'secondary';
    const variants: Record<string, 'default' | 'secondary' | 'outline'> = {
      published: 'default',
      draft: 'secondary',
      archived: 'outline',
    };
    return variants[status] || 'secondary';
  };

  const getTypeIcon = (type: string | undefined) => {
    if (!type) return <File className="h-4 w-4" />;
    if (type.includes('image')) return <ImageIcon className="h-4 w-4" />;
    if (type.includes('video')) return <Video className="h-4 w-4" />;
    return <FileText className="h-4 w-4" />;
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {pending3DScreenshot && (
        <StepThumbnailGenerator
          fileUrl={pending3DScreenshot.url}
          fileName={pending3DScreenshot.name}
          onComplete={(blob) => screenshotResolverRef.current?.(blob)}
        />
      )}
      {/* Header with back button */}
      <div className="flex items-center gap-3 px-6 py-4 border-b">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-2">
          {getTypeIcon(item.type || item.assetType)}
          <h2 className="text-lg font-semibold">{item.name || item.displayName}</h2>
        </div>
      </div>

      {/* Content: Left-Right Layout */}
      <div className="flex gap-6 flex-1 overflow-hidden p-6">
        {/* Left: Preview Area */}
        <div className="flex-1 min-w-0 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold">预览</h3>
            {hasMultipleImages && (
              <div className="text-xs text-muted-foreground">
                {currentImageIndex + 1} / {mediaArray.length}
              </div>
            )}
          </div>
          <div className="flex-1 rounded-lg border overflow-hidden bg-muted flex items-center justify-center relative">
            {/* Priority: media or thumbnail */}
            {(item.media || item.thumbnail) ? (
              <>
                {/* 文本文件显示 */}
                {isText ? (
                  <div className="w-full h-full overflow-auto p-4">
                    {isLoadingText ? (
                      <div className="flex flex-col items-center justify-center h-full">
                        <div className="mb-2 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                        <p className="text-sm text-muted-foreground">加载文本文件...</p>
                      </div>
                    ) : textError ? (
                      <div className="flex flex-col items-center justify-center h-full">
                        <FileText className="h-12 w-12 mb-2 opacity-50 text-destructive" />
                        <p className="text-sm text-destructive">{textError}</p>
                      </div>
                    ) : (
                      <pre className="text-xs font-mono whitespace-pre-wrap break-all">{textContent}</pre>
                    )}
                  </div>
                ) : (
                  <>
                    <MediaPreview
                      src={currentMedia}
                      alt={item.name}
                      type="auto"
                      thumbnail={item.thumbnail}
                      aspectRatio="auto"
                      className="w-full h-full object-contain"
                    />
                    {/* 左右切换按钮 */}
                    {hasMultipleImages && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute left-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-background/80 hover:bg-background shadow-lg"
                          onClick={handlePreviousImage}
                        >
                          <ChevronLeft className="h-6 w-6" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute right-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-background/80 hover:bg-background shadow-lg"
                          onClick={handleNextImage}
                        >
                          <ChevronRight className="h-6 w-6" />
                        </Button>
                        {/* 图片索引指示器 */}
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                          {mediaArray.map((_, index) => (
                            <button
                              key={index}
                              onClick={() => setCurrentImageIndex(index)}
                              className={`w-2 h-2 rounded-full transition-all ${
                                index === currentImageIndex
                                  ? 'bg-primary w-6'
                                  : 'bg-background/60 hover:bg-background/80'
                              }`}
                              aria-label={`跳转到第 ${index + 1} 张图片`}
                            />
                          ))}
                        </div>
                      </>
                    )}
                  </>
                )}
              </>
            ) : item.primaryContent ? (
              <>
                {/* Render based on primaryContent.type */}
                {item.primaryContent.type === 'image' ? (
                  <MediaPreview
                    src={item.primaryContent.value}
                    alt={item.name}
                    type="image"
                    aspectRatio="auto"
                    className="w-full h-full object-contain"
                  />
                ) : item.primaryContent.type === 'video' ? (
                  <MediaPreview
                    src={item.primaryContent.value}
                    alt={item.name}
                    type="video"
                    thumbnail={item.primaryContent.metadata?.thumbnailUrl}
                    aspectRatio="auto"
                    className="w-full h-full object-contain"
                  />
                ) : item.primaryContent.type === '3d' ? (
                  <MediaPreview
                    src={item.primaryContent.value}
                    alt={item.name}
                    type="3d"
                    thumbnail={item.primaryContent.metadata?.thumbnailUrl}
                    aspectRatio="auto"
                    className="w-full h-full object-contain"
                  />
                ) : item.primaryContent.type === 'text' ? (
                  <div className="w-full h-full p-4 text-sm whitespace-pre-wrap overflow-auto">
                    {item.primaryContent.value}
                  </div>
                ) : (
                  <div className="w-full h-full overflow-auto">
                    <pre ref={previewJsonRef} className="p-4 text-xs font-mono">
                      {JSON.stringify(item.primaryContent, null, 2)}
                    </pre>
                  </div>
                )}
              </>
            ) : (
              <div className="p-8 text-center text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>无预览</p>
              </div>
            )}
          </div>
        </div>

        {/* Right: Details */}
        <div className="w-[400px] flex-shrink-0 flex flex-col">
          <ScrollArea className="flex-1">
            <div className="space-y-6 pr-4 pb-10">
              {/* Basic Information */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold">基本信息</h3>
                <div className="space-y-3 text-sm">
                  {item.id && (
                    <div className="space-y-1">
                      <div className="text-muted-foreground">ID</div>
                      <div className="font-mono text-xs break-all">{item.id}</div>
                    </div>
                  )}

                  {(item.type || item.assetType) && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Tag className="h-3 w-3" />
                        类型
                      </div>
                      <Badge variant="secondary">{item.type || item.assetType}</Badge>
                    </div>
                  )}

                  {item.category && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <FolderOpen className="h-3 w-3" />
                        视图
                      </div>
                      <div>{item.category}</div>
                    </div>
                  )}

                  {item.status && (
                    <div className="space-y-1">
                      <div className="text-muted-foreground">状态</div>
                      <Badge variant={getStatusVariant(item.status)}>
                        {getStatusLabel(item.status)}
                      </Badge>
                    </div>
                  )}

                  {item.size !== undefined && (
                    <div className="space-y-1">
                      <div className="text-muted-foreground">大小</div>
                      <div>{formatFileSize(item.size)}</div>
                    </div>
                  )}

                  {item.viewCount !== undefined && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Eye className="h-3 w-3" />
                        查看次数
                      </div>
                      <div>{item.viewCount}</div>
                    </div>
                  )}

                  {item.downloadCount !== undefined && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Download className="h-3 w-3" />
                        下载次数
                      </div>
                      <div>{item.downloadCount}</div>
                    </div>
                  )}

                  {item.creatorUserId && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <User className="h-3 w-3" />
                        创建者
                      </div>
                      <div className="font-mono text-xs break-all">
                        {item.creatorUserId}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Primary Content Metadata */}
              {item.primaryContent?.metadata && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold">内容元数据</h3>
                    <div className="space-y-3 text-sm">
                      {item.primaryContent.metadata.width && (
                        <div className="space-y-1">
                          <div className="text-muted-foreground">宽度</div>
                          <div>{item.primaryContent.metadata.width}px</div>
                        </div>
                      )}
                      {item.primaryContent.metadata.height && (
                        <div className="space-y-1">
                          <div className="text-muted-foreground">高度</div>
                          <div>{item.primaryContent.metadata.height}px</div>
                        </div>
                      )}
                      {item.primaryContent.metadata.duration && (
                        <div className="space-y-1">
                          <div className="text-muted-foreground">时长</div>
                          <div>{item.primaryContent.metadata.duration}s</div>
                        </div>
                      )}
                      {item.primaryContent.metadata.format && (
                        <div className="space-y-1">
                          <div className="text-muted-foreground">格式</div>
                          <div>{item.primaryContent.metadata.format}</div>
                        </div>
                      )}
                      {item.primaryContent.metadata.size && (
                        <div className="space-y-1">
                          <div className="text-muted-foreground">文件大小</div>
                          <div>{formatFileSize(item.primaryContent.metadata.size)}</div>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* Additional Files */}
              {item.files && item.files.length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold">附加文件</h3>
                    <div className="space-y-2">
                      {item.files.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 rounded-lg border bg-muted/50"
                        >
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <File className="h-4 w-4 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm truncate">
                                {file.name}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {file.type} · {formatFileSize(file.size)}
                              </div>
                            </div>
                          </div>
                          <a
                            href={file.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline text-sm"
                          >
                            下载
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Custom Properties */}
              {((item.properties && Object.keys(item.properties).length > 0) ||
                (item.metadata && Object.keys(item.metadata).length > 0)) && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold">自定义属性</h3>
                    <div className="space-y-2">
                      {Object.entries(item.properties || item.metadata || {}).map(
                        ([key, value]) => (
                          <div
                            key={key}
                            className="flex items-start gap-4 p-3 rounded-lg border bg-muted/50"
                          >
                            <div className="font-medium text-sm min-w-[120px]">
                              {key}
                            </div>
                            <div className="text-sm text-muted-foreground break-all flex-1">
                              {typeof value === 'object'
                                ? JSON.stringify(value, null, 2)
                                : String(value)}
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </>
              )}

              <Separator />

              {/* Time Information */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold">时间信息</h3>
                <div className="space-y-3 text-sm">
                  {item.createdTimestamp && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        创建时间
                      </div>
                      <div>{formatDate(item.createdTimestamp)}</div>
                    </div>
                  )}
                  {item.updatedTimestamp && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        更新时间
                      </div>
                      <div>{formatDate(item.updatedTimestamp)}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              {(item.description || item.primaryContent?.description) && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold">描述</h3>
                    <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {item.description || item.primaryContent?.description}
                    </div>
                  </div>
                </>
              )}

              <Separator />

              {/* Complete JSON Data */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold">完整元数据 (JSON)</h3>
                <div className="w-full max-w-full overflow-hidden rounded-lg border bg-muted">
                  <pre
                    ref={metadataJsonRef}
                    className="p-4 text-xs overflow-x-auto overflow-y-auto max-h-96 font-mono whitespace-pre-wrap break-all"
                  >
                    {JSON.stringify(item, null, 2)}
                  </pre>
                </div>
              </div>

              {/* 转换（UI 对齐团队资产） */}
              <div className="border-t border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-black">
                <div className="flex flex-col gap-3">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">转换</label>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="whitespace-nowrap rounded bg-gray-100 px-2 py-1 text-sm font-medium text-gray-700 dark:bg-gray-900 dark:text-gray-300">
                      {sourceLabel}
                    </span>
                    <span className="text-gray-400 dark:text-gray-500">→</span>
                    <Select value={conversionType} onValueChange={(v) => setConversionType(v as any)}>
                      <SelectTrigger className="h-8 w-24 shrink-0 border-gray-300 dark:border-gray-700">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {isTextSource ? <SelectItem value="image">图片</SelectItem> : <SelectItem value="text">文本</SelectItem>}
                        <SelectItem value="symbol-summary">符号概括</SelectItem>
                        <SelectItem value="3d-model">3D模型</SelectItem>
                        <SelectItem value="neural-model">神经模型</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      size="small"
                      className="ml-auto shrink-0 whitespace-nowrap rounded-md bg-black px-4 py-2 font-medium text-white hover:bg-black hover:text-white dark:bg-white dark:text-black"
                      disabled={
                        // 文本：只在“正在拉取文本内容”时禁用，避免一直灰掉
                        (isTextSource && !!textUrlForFetch && isLoadingText) ||
                        (!isTextSource && !is3DSource && !imageUrlForImage) ||
                        (!isTextSource && is3DSource && !modelUrlFor3D)
                      }
                      onClick={handleStartConversion}
                    >
                      开始转换
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
