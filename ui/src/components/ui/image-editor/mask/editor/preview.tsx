import React from 'react';

import { AnimatePresence, motion } from 'framer-motion';

import { VinesImage } from '@/components/ui/image';

interface IMaskPreviewProps {
  visible: boolean;

  src: string;
}

export const MaskPreview: React.FC<IMaskPreviewProps> = ({ src, visible }) => {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="absolute bottom-1 right-1 -m-5 !-mb-3.5 scale-75"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="flex h-20 w-32 overflow-hidden rounded border border-input bg-background opacity-70 transition-opacity hover:opacity-100 [&>div]:mx-auto">
            <VinesImage className="h-full w-auto" src={src} />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
