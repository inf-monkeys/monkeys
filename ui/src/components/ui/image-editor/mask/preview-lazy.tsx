import React, { useState } from 'react';

import { Meta, Uppy } from '@uppy/core';
import { useEventEmitter } from 'ahooks';
import { motion } from 'framer-motion';
import { PencilRuler, Undo2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { VinesImageMaskEditor } from '@/components/ui/image-editor/mask/index.tsx';
import { IVinesImageMaskPreviewProps } from '@/components/ui/image-editor/mask/preview.tsx';
import { Separator } from '@/components/ui/separator.tsx';
import { VinesUploader } from '@/components/ui/vines-uploader';
import { cn } from '@/utils';

const VinesImageMaskPreview: React.FC<IVinesImageMaskPreviewProps> = ({ src, className, onFinished }) => {
  const { t } = useTranslation();

  const [visible, setVisible] = useState(false);

  const [uppy, setUppy] = React.useState<Uppy<Meta, Record<string, never>> | null>(null);
  const uppy$ = useEventEmitter<Uppy<Meta, Record<string, never>>>();
  uppy$.useSubscription((uppyObject) => {
    if (!uppy) {
      setUppy(uppyObject);
    }
  });

  return (
    <div className="vines-center relative size-full">
      <motion.div
        key="field-image-mask-editor"
        initial={{ opacity: 0 }}
        animate={{ opacity: visible ? 1 : 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className={cn('pointer-events-none absolute size-full', visible && 'pointer-events-auto z-20', className)}
      >
        <VinesImageMaskEditor
          className="h-[15.8rem]"
          src={src}
          onFinished={(val) => {
            if (uppy) {
              uppy.removeFiles(uppy.getFiles().map((it) => it.id));
              uppy.addFile(val);
            }
            setVisible(false);
          }}
        >
          <Button
            className="h-7 px-2 py-1"
            icon={<Undo2 />}
            variant="outline"
            size="small"
            onClick={() => setVisible(false)}
          >
            {t('components.ui.vines-image-mask-editor.preview.back')}
          </Button>
          <Separator orientation="vertical" className="h-4" />
        </VinesImageMaskEditor>
      </motion.div>
      <motion.div
        key="field-image-mask-editor-preview"
        className={cn('vines-center group relative size-full', visible && 'pointer-events-none z-0')}
        initial={{ opacity: 0 }}
        animate={{ opacity: visible ? 0 : 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
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
