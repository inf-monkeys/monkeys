import React from 'react';

import { omit } from 'lodash';

import {
  IUseLayerOptions,
  useLayer,
} from '@/components/layout/workspace/vines-view/form/tabular/render/field/canvas-assisted-interaction/layer/use-layer.ts';
import { VinesLucideIcon } from '@/components/ui/vines-icon/lucide';
import { VinesImage } from '@/components/ui/vines-image';
import { cn } from '@/utils';

interface ICaiLayerProps extends React.ComponentPropsWithoutRef<'div'>, Omit<IUseLayerOptions, 'style'> {}

export const CaiLayer: React.FC<ICaiLayerProps> = ({
  layer,
  values,
  maxWidth,
  maxHeight,
  className,
  style,
  setLayerScale,
  ...props
}) => {
  const { layerStyle, layerValues } = useLayer({
    layer,
    values,
    maxWidth,
    maxHeight,
    setLayerScale,
    style,
  });

  return (
    <div
      className={cn('size-full', className)}
      style={layerStyle}
      {...omit(props, ['form', 'index', 'canvasWidth', 'canvasHeight', 'wheelEvent$'])}
    >
      {layerValues.icon && <VinesLucideIcon src={layerValues.icon.value as string} />}
      {layerValues.image && <VinesImage src={layerValues.image.value as string} disabledPreview />}
    </div>
  );
};
