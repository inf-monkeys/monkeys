import React, { useEffect, useState } from 'react';

import { AnimatePresence, motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { createShapeId, getSnapshot, TLShapeId } from 'tldraw';

import { updateDesignBoardMetadata, useDesignBoardMetadata } from '@/apis/designs';
import { Board } from '@/components/layout/design-space/board';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator.tsx';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { FrameSizeInput } from '@/components/ui/vines-design/frame-size-input';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { useDesignBoardStore } from '@/store/useDesignBoardStore';
import { usePageStore } from '@/store/usePageStore';
import { cn } from '@/utils';
import { downloadFile } from '@/utils/file.ts';

const DesignBoardView: React.FC = () => {
  const { t, i18n } = useTranslation();

  const { editor, setEditor, designBoardId, setDesignBoardId } = useDesignBoardStore();

  const [themeMode] = useLocalStorage<string>('vines-ui-dark-mode', 'auto', false);

  const { data: metadata, mutate: mutateMetadata } = useDesignBoardMetadata(designBoardId);

  const containerHeight = usePageStore((s) => s.containerHeight);
  const workbenchVisible = usePageStore((s) => s.workbenchVisible);

  const [sidebarVisible, setSidebarVisible] = useState(!workbenchVisible);

  const [frameShapeId, setFrameShapeId] = useState<TLShapeId>(createShapeId('shape:parentFrame'));

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

  useEffect(() => {
    if (!editor) return;
    editor.user.updateUserPreferences({
      colorScheme: themeMode === 'auto' ? 'system' : (themeMode as 'dark' | 'light'),
    });
  }, [editor, themeMode]);

  i18n.on('languageChanged', (lang) => {
    if (!editor) return;
    editor.user.updateUserPreferences({
      locale: lang === 'zh' ? 'zh-cn' : 'en',
    });
  });

  // lock frame
  useEffect(() => {
    if (!editor) return;
    editor.sideEffects.registerBeforeDeleteHandler('shape', (shape) => {
      if (shape.id === frameShapeId) return false;
      return;
    });
  }, [editor]);

  const handleExport = async () => {
    if (!editor) return;
    const ids = [frameShapeId];
    const { blob } = await editor.toImage(ids, { format: 'png', scale: 0.5 });
    const file = new File([blob], `${metadata?.displayName ?? 'Board'}-${Date.now()}.png`, { type: blob.type });
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
          void mutateMetadata();
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
          initial={workbenchVisible ? { width: 0, padding: '1rem 0' } : { width: 220, padding: '1rem 1rem' }}
          animate={{
            width: sidebarVisible ? 220 : 0,
            padding: sidebarVisible ? '1rem 1rem' : '1rem 0',
          }}
        >
          <AnimatePresence>
            {sidebarVisible && (
              <motion.div
                className="flex h-full flex-col justify-between"
                initial={{ opacity: 0, filter: 'blur(10px)' }}
                animate={{ opacity: 1, filter: 'blur(0px)' }}
                exit={{ opacity: 0, filter: 'blur(10px)' }}
              >
                <div className="flex flex-col">
                  <p className="mb-1.5 grid grid-cols-2 justify-start text-xs font-semibold capitalize">
                    <span>{t('design.view-config.canvas-setting.width')}</span>
                    <span className="pl-2">{t('design.view-config.canvas-setting.height')}</span>
                  </p>
                  <FrameSizeInput />
                </div>
                <div className="grid grid-cols-1 gap-2">
                  <Button variant="outline" onClick={handleExport}>
                    {t('common.utils.export')}
                  </Button>
                  <Button variant="outline" onClick={handleSave}>
                    {t('common.utils.save')}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
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
        persistenceKey={designBoardId}
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
