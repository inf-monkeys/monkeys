import React from 'react';

import { Eye } from 'lucide-react';
import Image from 'rc-image';

import { useLocalStorage } from '@/hooks/use-local-storage';

interface IVirtuaExecutionResultGridImageItemProps {
  src: string;
}

export const VirtuaExecutionResultGridImageItem: React.FC<IVirtuaExecutionResultGridImageItemProps> = ({ src }) => {
  const [mode] = useLocalStorage<string>('vines-ui-dark-mode', 'auto', false);

  const isDarkMode = mode === 'dark';

  return (
    <div className="box-border flex-none content-stretch p-1">
      <div className="vines-center overflow-hidden rounded-lg">
        <Image
          src={src}
          alt="image"
          className="aspect-square size-full transform rounded-lg border border-input object-cover object-center shadow-sm"
          loading="lazy"
          fallback={isDarkMode ? '/fallback_image_dark.webp' : '/fallback_image.webp'}
          preview={{
            mask: <Eye className="stroke-white" />,
          }}
        />
      </div>
    </div>
  );
};
