import { useEventEmitter } from 'ahooks';
import { Plus, X } from 'lucide-react';
import React, { useEffect, useRef } from 'react';
import { toast } from 'sonner';

import { cn } from '@/utils';
import { VinesUploader } from '@/components/ui/vines-uploader';

export type ReferenceSlot = {
  id: string;
  label: string;
  optional?: boolean;
  file?: File;
  previewUrl?: string;
  uploadedUrl?: string;
  uploading?: boolean;
};

export const ReferenceImageCard: React.FC<{
  slot: ReferenceSlot;
  onSelect: (slotId: string, file: File | null) => void;
  onUploaded: (slotId: string, url: string) => void;
  onUploadingChange: (slotId: string, uploading: boolean) => void;
  maskPreviewUrl?: string;
  onOpenMask?: (slotId: string, image: File | string) => void;
}> = ({ slot, onSelect, onUploaded, onUploadingChange, maskPreviewUrl, onOpenMask }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const uppy$ = useEventEmitter<any>();
  const uppyRef = useRef<any>(null);
  const lastUploadedFileRef = useRef<File | null>(null);
  uppy$?.useSubscription?.((uppy: any) => {
    uppyRef.current = uppy;
  });

  // 监听 slot.file 变化，当有新文件时触发上传
  useEffect(() => {
    if (slot.file && uppyRef.current?.addFile && slot.file !== lastUploadedFileRef.current) {
      lastUploadedFileRef.current = slot.file;
      // 清除之前的文件
      uppyRef.current.getFiles?.().forEach((f: any) => uppyRef.current.removeFile?.(f.id));
      try {
        uppyRef.current.addFile({ data: slot.file, name: slot.file.name, type: slot.file.type });
      } catch {
        // fallback
      }
    }
  }, [slot.file]);

  const handleFiles = (files: FileList | File[] | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (!file.type.startsWith('image/')) {
      toast.info('仅支持图片格式');
      return;
    }
    // 只调用 onSelect 更新状态和打开裁剪弹窗，不立即上传
    // 上传会在裁剪完成后或关闭弹窗时通过 slot.file 变化触发
    onSelect?.(slot.id, file);
  };

  const onDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    handleFiles(event.dataTransfer.files);
  };

  const onPaste = (event: React.ClipboardEvent<HTMLDivElement>) => {
    const { files, items } = event.clipboardData;
    if (files && files.length > 0) {
      handleFiles(files);
      return;
    }
    const imageItem = Array.from(items).find((item) => item.type.startsWith('image/'));
    if (imageItem) {
      const file = imageItem.getAsFile();
      if (file) handleFiles([file]);
    }
  };

  return (
    <div className="flex flex-col gap-0">
      <VinesUploader
        className="hidden"
        basePath="user-files/workflow-input"
        max={1}
        files={slot.uploadedUrl ? [slot.uploadedUrl] : []}
        uppy$={uppy$}
        onChange={(urls) => {
          const url = urls?.[0] ?? '';
          onUploaded(slot.id, url);
        }}
      />
      <div
        ref={containerRef}
        tabIndex={0}
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
        onPaste={onPaste}
        onMouseEnter={() => containerRef.current?.focus()}
        className={cn(
          'group relative flex items-center justify-center text-white/80 transition focus-visible:outline-none rounded-[12px] overflow-hidden border border-[rgba(44,94,245,0.3)]',
          'bg-[rgba(44,94,245,0.15)] hover:bg-[rgba(44,94,245,0.25)]',
        )}
        style={{
          width: 101,
          height: 112,
          boxSizing: 'border-box',
          borderRadius: 12,
          zIndex: 0,
        }}
        onClick={(e) => {
          if (slot.id === 'base' && (slot.previewUrl || slot.uploadedUrl) && onOpenMask) {
            const image = slot.uploadedUrl || slot.previewUrl;
            if (image) {
              onOpenMask(slot.id, image);
              return;
            }
          }
          // 默认点击用于聚焦，便于粘贴
          (e.currentTarget as HTMLDivElement).focus();
        }}
      >
        {slot.previewUrl ? (
          <>
            <img src={slot.previewUrl} alt={slot.label} className="h-full w-full object-cover" />
            {maskPreviewUrl && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <img
                  src={maskPreviewUrl}
                  alt="mask-preview"
                  className="h-full w-full object-cover mix-blend-screen"
                  style={{ opacity: 0.6 }}
                />
              </div>
            )}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelect?.(slot.id, null);
                if (uppyRef.current) {
                  uppyRef.current.getFiles?.().forEach((f: any) => uppyRef.current.removeFile?.(f.id));
                }
              }}
              className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-sm bg-black/60 text-white transition hover:bg-black/80 p-0"
              aria-label="移除图片"
            >
              <X className="size-3.5" stroke="white" />
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 text-white/70">
            <div
              className="flex items-center justify-center"
              style={{
                width: 28,
                height: 28,
                borderRadius: 77,
                background: 'rgba(44, 94, 245, 0.2)',
              }}
            >
              <Plus className="size-4 text-white" strokeWidth={2.5} stroke="white" />
            </div>
            <span
              className="text-center"
              style={{
                fontFamily: 'Alibaba PuHuiTi 2.0',
                fontSize: 12,
                fontWeight: 600,
                lineHeight: '16.8px',
                letterSpacing: '0.002em',
                color: 'rgba(255, 255, 255, 0.6)',
              }}
            >
              {slot.label}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
