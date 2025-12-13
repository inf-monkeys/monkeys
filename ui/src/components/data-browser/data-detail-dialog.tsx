import { useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MediaPreview } from '@/components/ui/media-preview';
import type { DataItem } from '@/types/data';
import { format } from 'date-fns';
import {
  Calendar,
  Eye,
  Download,
  FileText,
  User,
  Tag,
  FolderOpen,
  Image as ImageIcon,
  Video,
  File,
} from 'lucide-react';

interface DataDetailDialogProps {
  item: DataItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DataDetailDialog({
  item,
  open,
  onOpenChange,
}: DataDetailDialogProps) {
  // ⚠️ IMPORTANT: All hooks MUST be called before any early return
  const dialogContentRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const previewJsonRef = useRef<HTMLPreElement>(null);
  const metadataJsonRef = useRef<HTMLPreElement>(null);

  // 测量 DOM 元素宽度
  useEffect(() => {
    if (open && item) {
      setTimeout(() => {
        if (dialogContentRef.current) {
          console.log('📐 [DialogContent] clientWidth:', dialogContentRef.current.clientWidth);
          console.log('📐 [DialogContent] scrollWidth:', dialogContentRef.current.scrollWidth);
          console.log('📐 [DialogContent] offsetWidth:', dialogContentRef.current.offsetWidth);
        }
        if (scrollAreaRef.current) {
          console.log('📐 [ScrollArea] clientWidth:', scrollAreaRef.current.clientWidth);
          console.log('📐 [ScrollArea] scrollWidth:', scrollAreaRef.current.scrollWidth);
          console.log('📐 [ScrollArea] offsetWidth:', scrollAreaRef.current.offsetWidth);
        }
        if (previewJsonRef.current) {
          console.log('📐 [PreviewJSON] clientWidth:', previewJsonRef.current.clientWidth);
          console.log('📐 [PreviewJSON] scrollWidth:', previewJsonRef.current.scrollWidth);
          console.log('📐 [PreviewJSON] offsetWidth:', previewJsonRef.current.offsetWidth);
        }
        if (metadataJsonRef.current) {
          console.log('📐 [MetadataJSON] clientWidth:', metadataJsonRef.current.clientWidth);
          console.log('📐 [MetadataJSON] scrollWidth:', metadataJsonRef.current.scrollWidth);
          console.log('📐 [MetadataJSON] offsetWidth:', metadataJsonRef.current.offsetWidth);
        }
      }, 100);
    }
  }, [open, item]);

  // Early return AFTER all hooks
  if (!item) return null;

  // 调试日志
  console.log('🔍 [DataDetailDialog] Item data:', item);
  console.log('🔍 [DataDetailDialog] Dialog open:', open);

  // JSON 字符串长度调试
  const itemJsonString = JSON.stringify(item, null, 2);
  const primaryContentJsonString = item.primaryContent ? JSON.stringify(item.primaryContent, null, 2) : '';
  console.log('📊 [DataDetailDialog] Item JSON length:', itemJsonString.length);
  console.log('📊 [DataDetailDialog] Item JSON max line length:', Math.max(...itemJsonString.split('\n').map(line => line.length)));
  if (item.primaryContent) {
    console.log('📊 [DataDetailDialog] PrimaryContent JSON length:', primaryContentJsonString.length);
    console.log('📊 [DataDetailDialog] PrimaryContent JSON max line length:', Math.max(...primaryContentJsonString.split('\n').map(line => line.length)));
  }

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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent ref={dialogContentRef} className="max-w-[90vw] max-h-[90vh] w-full">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getTypeIcon(item.type || item.assetType)}
            {item.name || item.displayName}
          </DialogTitle>
        </DialogHeader>

        {/* 左右布局 */}
        <div className="flex gap-6 h-[calc(90vh-120px)] overflow-hidden">
          {/* 左侧：预览区域 */}
          <div className="flex-1 min-w-0 flex flex-col">
            <h3 className="text-sm font-semibold mb-3">预览</h3>
            <div className="flex-1 rounded-lg border overflow-hidden bg-muted flex items-center justify-center">
              {/* 优先使用 media 或 thumbnail */}
              {(item.media || item.thumbnail) ? (
                <MediaPreview
                  src={item.media || item.thumbnail || ''}
                  alt={item.name}
                  type="auto"
                  thumbnail={item.thumbnail}
                  aspectRatio="auto"
                  className="w-full h-full object-contain"
                />
              ) : item.primaryContent ? (
                <>
                  {/* 根据 primaryContent.type 渲染 */}
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

          {/* 右侧：详细信息 */}
          <div className="w-[400px] flex-shrink-0 flex flex-col">
            <ScrollArea ref={scrollAreaRef} className="flex-1">
              <div className="space-y-6 pr-4">

            {/* 基本信息 */}
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

            {/* 主内容元数据 */}
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

            {/* 附加文件 */}
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

            {/* 自定义属性 */}
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

            {/* 时间信息 */}
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

            {/* 描述信息 */}
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

            {/* 完整数据 JSON */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold">完整元数据 (JSON)</h3>
              <div className="w-full overflow-hidden rounded-lg border bg-muted">
                <pre ref={metadataJsonRef} className="p-4 text-xs overflow-x-auto overflow-y-auto max-h-96 font-mono">
                  {JSON.stringify(item, null, 2)}
                </pre>
              </div>
            </div>
              </div>
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
