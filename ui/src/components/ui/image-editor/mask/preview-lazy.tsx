import React, { useState } from 'react';

import { Meta, Uppy } from '@uppy/core';
import { useEventEmitter, useMemoizedFn } from 'ahooks';
import { motion } from 'framer-motion';
import { Fullscreen, PencilRuler, Undo2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { VinesImageMaskEditor } from '@/components/ui/image-editor/mask/index.tsx';
import { IVinesImageMaskPreviewProps } from '@/components/ui/image-editor/mask/preview.tsx';
import { Separator } from '@/components/ui/separator.tsx';
import { VinesUploader } from '@/components/ui/vines-uploader';
import useUrlState from '@/hooks/use-url-state.ts';
import { cn } from '@/utils';

const VinesImageMaskPreview: React.FC<IVinesImageMaskPreviewProps> = ({ src, className, onFinished }) => {
  const { t } = useTranslation();

  const [visible, setVisible] = useState(true);

  const [uppy, setUppy] = React.useState<Uppy<Meta, Record<string, never>> | null>(null);
  const uppy$ = useEventEmitter<Uppy<Meta, Record<string, never>>>();
  uppy$.useSubscription((uppyObject) => {
    if (!uppy) {
      setUppy(uppyObject);
    }
  });

  const handleMaskEditFinished = useMemoizedFn((val: File) => {
    if (uppy) {
      uppy.removeFiles(uppy.getFiles().map((it) => it.id));
      uppy.addFile(val);
    }
    setVisible(false);
  });

  const [{ mode }] = useUrlState<{ mode: 'normal' | 'fast' | 'mini' }>({ mode: 'normal' });
  const isMiniMode = mode === 'mini';

  const [fullScreenDialog, setFullScreenDialog] = useState(false);
  const [fullScreen, setFullScreen] = useState(false);

  return (
    <div className="vines-center relative size-full">
      <motion.div
        key="field-image-mask-editor"
        initial={{ opacity: 0 }}
        animate={{ opacity: visible ? 1 : 0, height: visible ? 500 : 253 }}
        exit={{ opacity: 0 }}
        className={cn('pointer-events-none top-0 size-full', visible && 'pointer-events-auto z-20', className)}
      >
        <VinesImageMaskEditor
          className="h-full min-h-[15.8rem]"
          src={src}
          onFinished={handleMaskEditFinished}
          mini={isMiniMode}
        >
          <Button
            className="h-7 border-transparent px-2 py-1 shadow-none"
            icon={<Undo2 />}
            variant="outline"
            size="small"
            onClick={() => setVisible(false)}
          >
            {t('components.ui.vines-image-mask-editor.preview.back')}
          </Button>
          <Dialog
            open={fullScreenDialog}
            onOpenChange={(val) => {
              setFullScreenDialog(val);
              !val && setFullScreen(val);
            }}
            modal={false}
          >
            <DialogTrigger asChild>
              <Button
                className="border-transparent !p-1 shadow-none"
                icon={<Fullscreen />}
                variant="outline"
                size="small"
                onClick={() => setVisible(false)}
              >
                {t('components.ui.vines-image-mask-editor.toolbar.zoom-in-editor.label')}
              </Button>
            </DialogTrigger>
            <DialogContent
              className={cn(
                'flex flex-col',
                fullScreen ? 'h-screen max-w-[100vw] pt-10' : 'h-[60vh] max-w-[55vw]',
                isMiniMode && 'max-w-[100vw]',
              )}
            >
              {!fullScreen && (
                <DialogTitle className="h-5">{t('components.ui.vines-image-mask-editor.preview.label')}</DialogTitle>
              )}
              <VinesImageMaskEditor
                className="!size-full"
                src={src}
                onFinished={(val) => {
                  handleMaskEditFinished(val);
                  setFullScreenDialog(false);
                }}
                mini={isMiniMode}
              >
                <Button
                  className="border-transparent !p-1 shadow-none"
                  icon={<Fullscreen />}
                  variant="outline"
                  size="small"
                  onClick={() => setFullScreen(!fullScreen)}
                >
                  {fullScreen
                    ? t('components.ui.vines-image-mask-editor.toolbar.exit-fullscreen')
                    : t('components.ui.vines-image-mask-editor.toolbar.fullscreen')}
                </Button>
              </VinesImageMaskEditor>
            </DialogContent>
          </Dialog>
          <Separator orientation="vertical" className="h-4" />
        </VinesImageMaskEditor>
      </motion.div>
      <motion.div
        key="field-image-mask-editor-preview"
        className={cn('vines-center group absolute size-full', visible && 'pointer-events-none z-0')}
        initial={{ opacity: 0 }}
        animate={{ opacity: visible ? 0 : 1 }}
        exit={{ opacity: 0 }}
      >
        <VinesUploader
          max={1}
          files={[src]}
          onChange={(files) => onFinished?.(files[0])}
          className="w-full"
          uppy$={uppy$}
          basePath="workflow/image-mask"
        >
          <Button variant="outline" icon={<PencilRuler />} onClick={() => setVisible(true)} disabled={!src}>
            {t('components.ui.vines-image-mask-editor.preview.label')}
          </Button>
        </VinesUploader>
      </motion.div>
    </div>
  );
};

export default VinesImageMaskPreview;
