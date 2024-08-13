import React from 'react';

import { Eye, FlipHorizontal, FlipVertical, RotateCcw, RotateCw, X, ZoomIn, ZoomOut } from 'lucide-react';
import Image from 'rc-image';
import { useTranslation } from 'react-i18next';

import { ToolButton } from '@/components/layout/workspace/vines-view/flow/toolbar/tool-button.tsx';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useLocalStorage } from '@/hooks/use-local-storage';

interface IVinesImageProps extends React.ComponentPropsWithoutRef<'img'> {
  disabled?: boolean;
}

export const VinesImage: React.FC<Omit<IVinesImageProps, 'onClick'>> = ({ src, disabled, ...attr }) => {
  const { t } = useTranslation();

  const [mode] = useLocalStorage<string>('vines-ui-dark-mode', 'auto', false);

  const isDarkMode = mode === 'dark';

  return (
    <Image
      src={src}
      loading="lazy"
      fallback={
        isDarkMode
          ? 'https://gw.alipayobjects.com/zos/kitchen/nhzBb%24r0Cm/image_off_dark.webp'
          : 'https://gw.alipayobjects.com/zos/kitchen/QAvkgt30Ys/image_off_light.webp'
      }
      preview={
        disabled
          ? false
          : {
              icons: {
                flipX: <ToolButton icon={<FlipHorizontal />} tip={t('components.ui.image-preview.flipX')} side="top" />,
                flipY: <ToolButton icon={<FlipVertical />} tip={t('components.ui.image-preview.flipY')} side="top" />,
                rotateLeft: (
                  <ToolButton icon={<RotateCcw />} tip={t('components.ui.image-preview.rotateLeft')} side="top" />
                ),
                rotateRight: (
                  <ToolButton icon={<RotateCw />} tip={t('components.ui.image-preview.rotateRight')} side="top" />
                ),
                zoomOut: <ToolButton icon={<ZoomOut />} tip={t('components.ui.image-preview.zoomOut')} side="top" />,
                zoomIn: <ToolButton icon={<ZoomIn />} tip={t('components.ui.image-preview.zoomIn')} side="top" />,
              },
              closeIcon: (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button icon={<X />} variant="outline" size="small" />
                  </TooltipTrigger>
                  <TooltipContent>{t('components.ui.image-preview.close')}</TooltipContent>
                </Tooltip>
              ),
              mask: <Eye className="stroke-white" />,
            }
      }
      {...attr}
    />
  );
};
