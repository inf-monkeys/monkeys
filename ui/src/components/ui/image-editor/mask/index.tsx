import React, { forwardRef, useState } from 'react';

import { useEventEmitter, useLatest } from 'ahooks';
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
import { applyMaskCanvasToOriginalImageFile, mergeBlobToFile } from '@/components/ui/image-editor/mask/editor/utils.ts';
import { VinesLoading } from '@/components/ui/loading';
import { cn } from '@/utils';

export interface MaskEditorProps extends Omit<IMaskEditorProps, 'src' | 'setMaskContext' | 'maskContext'> {
  src: string | File;

  className?: string;
  onFinished?: (file: File) => void;

  children?: React.ReactNode;

  mini?: boolean;
}

export const VinesImageMaskEditor = forwardRef<HTMLDivElement, MaskEditorProps>(
  ({ src, onFinished, className, children, mini }, ref) => {
    const { t } = useTranslation();

    const [centerScale, setCenterScale] = useState(1);

    const [editable, setEditable] = useState(true);
    const [contrast, setContrast] = useState(false);
    const [maskContext, setMaskContext] = useState<CanvasRenderingContext2D | null>(null);

    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [maskFileBlob, setMaskFileBlob] = useState<Blob | null>(null);
    const [progress, setProgress] = useState(0);

    const { file, optimizeImage, optimizeFile, onFileInputChange } = useImageOptimize({
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
    const [canUndo, setCanUndo] = useState(false);
    const [canRedo, setCanRedo] = useState(false);

    const maskEditorEvent$ = useEventEmitter<IMaskEditorEvent>();

    const [exporting, setExporting] = useState(false);
    const [exportProgress, setExportProgress] = useState(0);
    const isEdited = useLatest(maskFileBlob && optimizeFile);
    maskEditorEvent$.useSubscription(async (mode) => {
      if (mode === 'save' && isEdited.current && file && maskContext && onFinished) {
        setExporting(true);
        await new Promise((resolve) => setTimeout(resolve, 180));

        const mergeBlob = await applyMaskCanvasToOriginalImageFile(file, maskContext, setExportProgress);
        onFinished(mergeBlobToFile(file, mergeBlob as Blob));

        setExporting(false);
        setExportProgress(0);
      }
    });

    const isExport = exporting;

    return (
      <div
        ref={ref}
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
          {optimizeImage ? (
            <motion.div
              key="vines-image-mask-editor-main"
              className={cn('size-full space-y-2 transition-opacity', isExport && 'pointer-events-none !opacity-0')}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { delay: 0.2 } }}
              exit={{ opacity: 0 }}
            >
              <TransformWrapper
                minScale={0.05}
                initialScale={centerScale}
                centerOnInit
                panning={{ disabled: editable }}
              >
                {() => (
                  <>
                    <MaskEditorToolbar
                      mini={mini}
                      onFileInputChange={onFileInputChange}
                      event$={maskEditorEvent$}
                      disabledSave={!isEdited.current}
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
                          src={optimizeImage}
                          disabled={!editable}
                          contrast={contrast}
                          setCenterScale={setCenterScale}
                          onMouseDown={(e) => {
                            if (e.button === 1) {
                              setEditable(false);
                            }
                          }}
                          setPreviewImage={setPreviewImage}
                          setMaskFileBlob={setMaskFileBlob}
                          maskContext={maskContext}
                          setMaskContext={setMaskContext}
                          pointerMode={pointerMode}
                          brushSize={brushSize}
                          brushType={brushType}
                          setCanUndo={setCanUndo}
                          setCanRedo={setCanRedo}
                          event$={maskEditorEvent$}
                        />
                      </div>
                    </TransformComponent>

                    <MaskPreview
                      src={previewImage ?? optimizeImage}
                      contrast={contrast}
                      setContrast={setContrast}
                      mini={mini}
                    />
                  </>
                )}
              </TransformWrapper>
              <BrushBar
                pointerMode={pointerMode}
                setPointerMode={setPointerMode}
                brushSize={brushSize}
                setBrushSize={setBrushSize}
                brushType={brushType}
                setBrushType={setBrushType}
                canUndo={canUndo}
                canRedo={canRedo}
                event$={maskEditorEvent$}
              />
            </motion.div>
          ) : (
            <motion.div
              key="vines-image-mask-editor-loading"
              className="vines-center absolute left-0 top-0 size-full flex-col gap-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
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
  },
);

VinesImageMaskEditor.displayName = 'VinesImageMaskEditor';
