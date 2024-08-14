import React from 'react';

import { Eye } from 'lucide-react';
import Image, { ImagePreviewType } from 'rc-image';
import { PreviewGroupPreview } from 'rc-image/lib/PreviewGroup';

import { useVinesImageManage } from '@/components/ui/image/use-vines-image-manage.tsx';
import { useLocalStorage } from '@/hooks/use-local-storage';

interface IVinesImageProps extends React.ComponentProps<typeof Image> {
  disabled?: boolean;
}

export const VinesImage: React.FC<Omit<IVinesImageProps, 'onClick'>> = ({ src, disabled, preview = {}, ...attr }) => {
  const { icons, closeIcon } = useVinesImageManage();

  const [mode] = useLocalStorage<string>('vines-ui-dark-mode', 'auto', false);

  const isDarkMode = mode === 'dark';

  return (
    <Image
      src={src}
      loading="lazy"
      fallback={isDarkMode ? '/fallback_image_dark.webp' : '/fallback_image.webp'}
      preview={
        disabled
          ? false
          : {
              icons,
              closeIcon,
              mask: <Eye className="stroke-white" />,
              ...(preview as ImagePreviewType),
            }
      }
      {...attr}
    />
  );
};

export const VinesImageGroup: React.FC<React.ComponentProps<typeof Image.PreviewGroup> & { disabled?: boolean }> = ({
  children,
  disabled,
  preview = {},
  ...attr
}) => {
  const { icons, closeIcon } = useVinesImageManage();

  const [mode] = useLocalStorage<string>('vines-ui-dark-mode', 'auto', false);

  const isDarkMode = mode === 'dark';

  return (
    <Image.PreviewGroup
      fallback={isDarkMode ? '/fallback_image_dark.webp' : '/fallback_image.webp'}
      preview={
        disabled
          ? false
          : {
              icons,
              closeIcon,
              ...(preview as PreviewGroupPreview),
            }
      }
      {...attr}
    >
      {children}
    </Image.PreviewGroup>
  );
};
