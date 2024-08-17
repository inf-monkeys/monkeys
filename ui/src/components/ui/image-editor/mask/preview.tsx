import React, { useState } from 'react';

import { AnimatePresence, motion } from 'framer-motion';
import { PencilRuler, Undo2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { VinesImage } from '@/components/ui/image';
import { VinesImageMaskEditor } from '@/components/ui/image-editor/mask/index.tsx';
import { Separator } from '@/components/ui/separator.tsx';

interface IVinesImageMaskPreviewProps {
  src: string;
  onFinished?: (src: string) => void;

  className?: string;
}

export const VinesImageMaskPreview: React.FC<IVinesImageMaskPreviewProps> = ({ src, className, onFinished }) => {
  const { t } = useTranslation();

  const [visible, setVisible] = useState(false);

  return (
    <AnimatePresence mode="popLayout">
      {visible ? (
        <motion.div
          key="field-image-mask-editor"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <VinesImageMaskEditor
            className={className}
            src={src}
            onFinished={(val) => {
              onFinished?.(val);
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
      ) : (
        <motion.div
          key="field-image-mask-editor-preview"
          className="vines-center group relative size-full"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <VinesImage className="!h-52 w-auto rounded shadow" src={src} />
          <div
            className="absolute bottom-1 left-1/2 flex -translate-x-1/2 scale-75 transform flex-nowrap gap-1 rounded-md border bg-card p-1 opacity-0 shadow-sm transition-opacity group-hover:opacity-100"
            onClick={(e) => e.preventDefault()}
          >
            <Button
              className="[&_svg]:stroke-gold-12"
              variant="borderless"
              icon={<PencilRuler />}
              onClick={() => setVisible(true)}
            >
              {t('components.ui.vines-image-mask-editor.preview.label')}
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export const VinesImageMaskPreviewDialog: React.FC<
  IVinesImageMaskPreviewProps & {
    children: React.ReactNode;
  }
> = ({ children, ...props }) => {
  const { t } = useTranslation();

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-[35rem]">
        <DialogHeader>
          <DialogTitle>{t('components.ui.vines-image-mask-editor.preview.label')}</DialogTitle>
        </DialogHeader>
        <VinesImageMaskPreview className="h-96" {...props} />
      </DialogContent>
    </Dialog>
  );
};
