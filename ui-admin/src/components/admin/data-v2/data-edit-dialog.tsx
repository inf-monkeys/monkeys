import { getDataItemV2, updateDataItemV2 } from '@/apis/data-v2';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { DataItem } from '@/types/data';
import { Loader2 } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

type AssetStatus = 'draft' | 'published' | 'archived';

function normalizeMediaToText(media: DataItem['media']): string {
  if (!media) return '';
  if (Array.isArray(media)) return JSON.stringify(media);
  return String(media);
}

function tryParseMedia(value: string): DataItem['media'] {
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed.map(String);
      }
    } catch {
      // ignore
    }
  }
  return trimmed;
}

interface DataEditDialogV2Props {
  open: boolean;
  itemId: string | null;
  teamId: string;
  onOpenChange: (open: boolean) => void;
  onSaved: (updated: DataItem) => void;
}

export function DataEditDialogV2({
  open,
  itemId,
  teamId,
  onOpenChange,
  onSaved,
}: DataEditDialogV2Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [item, setItem] = useState<DataItem | null>(null);

  const [name, setName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [status, setStatus] = useState<AssetStatus>('published');
  const [thumbnail, setThumbnail] = useState('');
  const [mediaText, setMediaText] = useState('');
  const [description, setDescription] = useState('');

  const initialSnapshotRef = useRef<{
    name: string;
    displayName: string;
    status: AssetStatus;
    thumbnail: string;
    mediaText: string;
    description: string;
  } | null>(null);
  const loadSeqRef = useRef(0);

  const dialogTitle = useMemo(() => {
    const title = (item?.name || item?.displayName || '').trim();
    return title ? `编辑：${title}` : '编辑数据';
  }, [item?.displayName, item?.name]);

  useEffect(() => {
    if (!open) {
      setIsLoading(false);
      setIsSaving(false);
      setItem(null);
      initialSnapshotRef.current = null;
      return;
    }

    if (!itemId) return;
    if (!teamId) {
      toast.error('请先填写团队 ID');
      onOpenChange(false);
      return;
    }

    const currentSeq = (loadSeqRef.current += 1);
    setIsLoading(true);

    void (async () => {
      try {
        const fullItem = await getDataItemV2(teamId, itemId);
        if (loadSeqRef.current !== currentSeq) return;

        const normalized: DataItem = {
          ...fullItem,
          media:
            typeof fullItem.media === 'string' && fullItem.media.trim().startsWith('[')
              ? tryParseMedia(fullItem.media)
              : fullItem.media,
        };

        setItem(normalized);
        const initial = {
          name: (normalized.name ?? '').toString(),
          displayName: (normalized.displayName ?? '').toString(),
          status: (normalized.status ?? 'published') as AssetStatus,
          thumbnail: (normalized.thumbnail ?? '').toString(),
          mediaText: normalizeMediaToText(normalized.media),
          description: (normalized.description ?? '').toString(),
        };

        setName(initial.name);
        setDisplayName(initial.displayName);
        setStatus(initial.status);
        setThumbnail(initial.thumbnail);
        setMediaText(initial.mediaText);
        setDescription(initial.description);
        initialSnapshotRef.current = initial;
      } catch (error: any) {
        if (loadSeqRef.current !== currentSeq) return;
        toast.error(error?.message || '加载数据详情失败');
        onOpenChange(false);
      } finally {
        if (loadSeqRef.current !== currentSeq) return;
        setIsLoading(false);
      }
    })();
  }, [open, itemId, teamId, onOpenChange]);

  const handleSave = async () => {
    if (!itemId) return;
    if (!teamId) {
      toast.error('请先填写团队 ID');
      return;
    }
    const snapshot = initialSnapshotRef.current;
    if (!snapshot) return;

    const payload: Partial<DataItem> = {};

    const nextName = name.trim();
    const nextDisplayName = displayName.trim();
    const nextThumbnail = thumbnail.trim();
    const nextMediaText = mediaText.trim();
    const nextDescription = description.trim();

    if (nextName !== snapshot.name) payload.name = nextName;
    if (nextDisplayName !== snapshot.displayName) payload.displayName = nextDisplayName;
    if (status !== snapshot.status) payload.status = status;
    if (nextThumbnail !== snapshot.thumbnail) payload.thumbnail = nextThumbnail;
    if (nextMediaText !== snapshot.mediaText) payload.media = nextMediaText;
    if (nextDescription !== snapshot.description) payload.description = nextDescription;

    if (Object.keys(payload).length === 0) {
      toast.info('没有需要保存的修改');
      onOpenChange(false);
      return;
    }

    try {
      setIsSaving(true);
      const updated = await updateDataItemV2(teamId, itemId, payload);

      const normalized: DataItem = {
        ...updated,
        media:
          typeof updated.media === 'string' && updated.media.trim().startsWith('[')
            ? tryParseMedia(updated.media)
            : updated.media,
      };

      toast.success('保存成功');
      onSaved(normalized);
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error?.message || '保存失败');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>修改基础信息并保存后会更新更新时间。</DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex h-40 items-center justify-center">
            <div className="text-center">
              <Loader2 className="mx-auto mb-2 h-6 w-6 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">加载中...</p>
            </div>
          </div>
        ) : (
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">名称</Label>
                <Input
                  id="edit-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="请输入名称"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-display-name">显示名称</Label>
                <Input
                  id="edit-display-name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="用于展示的名称（可选）"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>状态</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as AssetStatus)}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择状态" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="published">已发布</SelectItem>
                    <SelectItem value="draft">草稿</SelectItem>
                    <SelectItem value="archived">已归档</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-thumbnail">缩略图 URL</Label>
                <Input
                  id="edit-thumbnail"
                  value={thumbnail}
                  onChange={(e) => setThumbnail(e.target.value)}
                  placeholder="https://..."
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-media">媒体 URL（支持 JSON 数组字符串）</Label>
              <Textarea
                id="edit-media"
                value={mediaText}
                onChange={(e) => setMediaText(e.target.value)}
                placeholder='示例：https://... 或 ["https://...","https://..."]'
                rows={3}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-description">描述</Label>
              <Textarea
                id="edit-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="可选"
                rows={4}
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            取消
          </Button>
          <Button onClick={handleSave} disabled={isLoading || isSaving || !itemId}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                保存中...
              </>
            ) : (
              '保存'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
