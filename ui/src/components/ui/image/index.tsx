import React, { useState } from 'react';

import { useAsyncEffect } from 'ahooks';
import { Eye } from 'lucide-react';
import Image, { ImagePreviewType } from 'rc-image';
import { PreviewGroupPreview } from 'rc-image/lib/PreviewGroup';

import { useVinesImageManage } from '@/components/ui/image/use-vines-image-manage.tsx';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { checkImageUrlAvailable } from '@/utils';

interface IVinesImageProps extends React.ComponentProps<typeof Image> {
  disabled?: boolean;
}

export const VinesImage: React.FC<IVinesImageProps> = ({ src, disabled, preview = {}, onClick, ...attr }) => {
  const { icons, closeIcon } = useVinesImageManage();

  const [mode] = useLocalStorage<string>('vines-ui-dark-mode', 'auto', false);

  const isDarkMode = mode === 'dark';

  const [previewSrc, setPreviewSrc] = useState<string | undefined>(src);

  useAsyncEffect(async () => {
    if (!src) return;
    if (src.startsWith('blob:')) {
      setPreviewSrc(src);
      return;
    }
    const srcArr = src.split('/');
    const srcArrLength = srcArr.length;

    const finalSrc = srcArr.map((it, i) => (i === srcArrLength - 2 ? `${it}_thumb` : it)).join('/');
    if (await checkImageUrlAvailable(finalSrc)) {
      setPreviewSrc(finalSrc);
    }
  }, [src]);

  return (
    <Image
      src={previewSrc}
      loading="lazy"
      fallback={isDarkMode ? '/fallback_image_dark.webp' : '/fallback_image.webp'}
      onClick={onClick}
      preview={
        disabled || onClick
          ? false
          : {
              src,
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
