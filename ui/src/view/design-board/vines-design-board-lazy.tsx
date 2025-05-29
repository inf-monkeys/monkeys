import React, { useEffect, useState } from 'react';

import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { createShapeId, getSnapshot, TLShapeId } from 'tldraw';

import { Board } from '@/components/layout/design-space/board';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator.tsx';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useDesignBoardStore } from '@/store/useDesignBoardStore';
import { usePageStore } from '@/store/usePageStore';
import { cn } from '@/utils';
import { downloadFile } from '@/utils/file.ts';
import { updateDesignBoardMetadata, useDesignBoardMetadata } from '@/apis/designs';
import { toast } from 'sonner';

const DesignBoardView: React.FC = () => {
  const { t } = useTranslation();

  const { editor, setEditor, designBoardId, setDesignBoardId } = useDesignBoardStore();

  const { data: metadata, mutate } = useDesignBoardMetadata(designBoardId);

  const containerHeight = usePageStore((s) => s.containerHeight);
  const workbenchVisible = usePageStore((s) => s.workbenchVisible);

  const [sidebarVisible, setSidebarVisible] = useState(!workbenchVisible);

  const [frameShapeId, setFrameShapeId] = useState<TLShapeId>(createShapeId());

  const [canvasWidth, setCanvasWidth] = useState<number>(1280);
  const [canvasHeight, setCanvasHeight] = useState<number>(720);

  const [boardCanvasSize, setBoardCanvasSize] = useState<{ width: number; height: number }>({
    width: 1280,
    height: 720,
  });

  useEffect(() => {
    if (!metadata || !editor) return;
    editor.loadSnapshot(metadata.snapshot);
  }, [metadata, editor]);

  const handleExport = async () => {
    if (!editor) return;
    const ids = [frameShapeId];
    const { blob } = await editor.toImage(ids, { format: 'png' });
    const file = new File([blob], `design-board-${Date.now()}.png`, { type: blob.type });
    downloadFile(file);
  };

  const handleSave = () => {
    if (!editor) return;
    const snapshot = getSnapshot(editor.store);
    toast.promise(
      updateDesignBoardMetadata(designBoardId, {
        snapshot,
      }),
      {
        success: () => {
          void mutate();
          return t('common.update.success');
        },
        error: t('common.update.error'),
        loading: t('common.update.loading'),
      },
    );
  };

  return (
    <div className={cn('relative flex h-full max-h-full')}>
      <div className="flex h-full max-w-64">
        <motion.div
          className="flex flex-col gap-4 overflow-hidden [&_h1]:line-clamp-1 [&_span]:line-clamp-1"
          initial={{ width: 256, padding: '1rem 1rem' }}
          animate={{
            width: sidebarVisible ? 256 : 0,
            padding: sidebarVisible ? '1rem 1rem' : '1rem 0',
          }}
        >
          <Button variant="outline" onClick={handleExport}>
            Export
          </Button>
          <Button variant="outline" onClick={handleSave}>
            Save
          </Button>
        </motion.div>
        <Separator orientation="vertical" className="vines-center">
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className="group z-10 flex h-4 w-3.5 cursor-pointer items-center justify-center rounded-sm border bg-border px-0.5 transition-opacity hover:opacity-75 active:opacity-95"
                onClick={() => setSidebarVisible(!sidebarVisible)}
              >
                <ChevronRight className={cn(sidebarVisible && 'scale-x-[-1]')} />
              </div>
            </TooltipTrigger>
            <TooltipContent>{sidebarVisible ? t('common.sidebar.hide') : t('common.sidebar.show')}</TooltipContent>
          </Tooltip>
        </Separator>
      </div>
      <Board
        editor={editor}
        setEditor={setEditor}
        canvasWidth={boardCanvasSize.width}
        canvasHeight={boardCanvasSize.height}
        instance={{ frameShapeId }}
      />
    </div>
  );
};

export default DesignBoardView;
