import React, { useState } from 'react';

import { useEventEmitter } from 'ahooks';
import { AnimatePresence, motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { TransformComponent, TransformWrapper } from 'react-zoom-pan-pinch';
import { toast } from 'sonner';

import { IMaskEditorEvent, IMaskEditorProps, MaskEditor } from '@/components/ui/image-editor/mask/editor';
import { BrushBar } from '@/components/ui/image-editor/mask/editor/brush-bar.tsx';
import { useImageOptimize } from '@/components/ui/image-editor/mask/editor/hooks/use-image-optimize.ts';
import { IVinesMaskEditorProps } from '@/components/ui/image-editor/mask/editor/hooks/use-vines-mask-editor.ts';
import { MaskPreview } from '@/components/ui/image-editor/mask/editor/preview.tsx';
import { MaskEditorToolbar } from '@/components/ui/image-editor/mask/editor/toolbar.tsx';
import { mergeBlobToFile } from '@/components/ui/image-editor/mask/editor/utils.ts';
import { VinesLoading } from '@/components/ui/loading';
import { cn } from '@/utils';

export interface MaskEditorProps extends Omit<IMaskEditorProps, 'src'> {
  src: string | File;

  className?: string;
  onFinished?: (file: File) => void;

  children?: React.ReactNode;
}

export const VinesImageMaskEditor: React.FC<MaskEditorProps> = ({ src, onFinished, className, children }) => {
  const { t } = useTranslation();

  const [centerScale, setCenterScale] = useState(1);

  const [editable, setEditable] = useState(true);
  const [miniPreview, setMiniPreview] = useState(true);

  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [maskFileBlob, setMaskFileBlob] = useState<Blob | null>(null);
  const [progress, setProgress] = useState(0);

  const { image, file, onFileInputChange, optimizeImage } = useImageOptimize({
    src,
    onProgress: setProgress,
    onFetchImageFailed: () => {
      toast.error(t('components.ui.vines-image-mask-editor.init.failed-to-fetch'));
    },
    onOptimizeFailed: () => {
      toast.error(t('components.ui.vines-image-mask-editor.init.failed-to-optimize'));
    },
    onFinished: () => {
      setPreviewImage(null);
    },
  });

  const [pointerMode, setPointerMode] = useState<IVinesMaskEditorProps['pointerMode']>('brush');
  const [brushSize, setBrushSize] = useState<IVinesMaskEditorProps['brushSize']>(12);
  const [brushType, setBrushType] = useState<IVinesMaskEditorProps['brushType']>('normal');

  const maskEditorEvent$ = useEventEmitter<IMaskEditorEvent>();

  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  maskEditorEvent$.useSubscription((mode) => {
    if (mode === 'save' && maskFileBlob && file) {
      setExporting(true);

      optimizeImage(new File([maskFileBlob], 'optimize-image', { type: 'image/png' }), setExportProgress)
        .then((result) => onFinished?.(mergeBlobToFile(file, result as Blob)))
        .finally(() => {
          setExporting(false);
          setExportProgress(0);
        });
    }
  });

  const isExport = exporting;

  return (
    <div
      className={cn('relative h-56 w-full overflow-hidden', className)}
      onClick={(e) => {
        if ((e.target as HTMLElement).getAttribute('type') !== 'file') {
          e.preventDefault();
          e.stopPropagation();
        }
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onMouseLeave={(e) => {
        if (!editable && e.buttons === 4) {
          setEditable(true);
        }
      }}
    >
      <AnimatePresence>
        {image ? (
          <motion.div
            key="vines-image-mask-editor-main"
            className={cn('size-full space-y-2 transition-opacity', isExport && 'pointer-events-none !opacity-0')}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { delay: 0.2 } }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <TransformWrapper minScale={0.05} initialScale={centerScale} centerOnInit panning={{ disabled: editable }}>
              {() => (
                <>
                  <MaskEditorToolbar
                    miniPreview={miniPreview}
                    setMiniPreview={setMiniPreview}
                    editable={editable}
                    setEditable={setEditable}
                    pointerMode={pointerMode}
                    setPointerMode={setPointerMode}
                    onFileInputChange={onFileInputChange}
                    event$={maskEditorEvent$}
                  >
                    {children}
                  </MaskEditorToolbar>

                  <TransformComponent wrapperClass="!h-[calc(100%-2.2rem)] !w-full">
                    <div
                      className={cn(editable ? 'cursor-crosshair' : 'cursor-move')}
                      onMouseUp={(e) => {
                        if (e.button === 1 && !editable) {
                          setEditable(true);
                        }
                      }}
                    >
                      <MaskEditor
                        src={image}
                        disabled={!editable}
                        setCenterScale={setCenterScale}
                        onMouseDown={(e) => {
                          if (e.button === 1) {
                            setEditable(false);
                          }
                        }}
                        setPreviewImage={setPreviewImage}
                        setMaskFileBlob={setMaskFileBlob}
                        pointerMode={pointerMode}
                        brushSize={brushSize}
                        brushType={brushType}
                        event$={maskEditorEvent$}
                      />
                    </div>
                  </TransformComponent>
                </>
              )}
            </TransformWrapper>
            <MaskPreview src={previewImage ?? image} visible={miniPreview} />
            <BrushBar
              pointerMode={pointerMode}
              brushSize={brushSize}
              setBrushSize={setBrushSize}
              brushType={brushType}
              setBrushType={setBrushType}
            />
          </motion.div>
        ) : (
          <motion.div
            key="vines-image-mask-editor-loading"
            className="vines-center size-full flex-col gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <VinesLoading immediately value={progress} />
            <span className="text-sm">{t('components.ui.vines-image-mask-editor.init.optimize', { progress })}</span>
          </motion.div>
        )}
        {isExport && (
          <motion.div
            key="vines-image-mask-editor-export"
            className="vines-center absolute left-0 top-0 size-full flex-col gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <VinesLoading immediately value={exportProgress} />
            <span className="text-sm">
              {t('components.ui.vines-image-mask-editor.init.export', { progress: exportProgress })}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
