import React from 'react';

import { AnimatePresence, motion } from 'framer-motion';
import { Eye } from 'lucide-react';
import Image from 'rc-image';

import { useVinesImageManage } from '@/components/ui/image/use-vines-image-manage.tsx';
import { cn } from '@/utils';

interface IMaskPreviewProps {
  visible: boolean;

  src: string;

  mini?: boolean;
}

export const MaskPreview: React.FC<IMaskPreviewProps> = ({ src, visible, mini }) => {
  const { icons, closeIcon } = useVinesImageManage();

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className={cn('absolute bottom-1 right-1', mini && ' -m-5 !-mb-3.5 scale-75')}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="flex h-20 w-32 overflow-hidden rounded border border-input bg-background opacity-70 transition-opacity hover:opacity-100 [&>div]:mx-auto">
            <Image
              src={src}
              preview={{
                icons,
                closeIcon,
                mask: <Eye className="stroke-white" />,
              }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
