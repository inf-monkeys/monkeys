import React from 'react';

import { omit } from 'lodash';

import {
  IUseLayerOptions,
  useLayer,
} from '@/components/layout/workspace/vines-view/form/tabular/render/field/canvas-assisted-interaction/layer/use-layer.ts';
import { cn } from '@/utils';

interface ICaiLayerProps extends React.ComponentPropsWithoutRef<'div'>, Omit<IUseLayerOptions, 'style'> {}

export const CaiLayer: React.FC<ICaiLayerProps> = ({
  layer,
  values,
  maxWidth,
  maxHeight,
  className,
  style,
  ...props
}) => {
  const { layerStyle } = useLayer({
    layer,
    values,
    maxWidth,
    maxHeight,
    style,
  });

  return (
    <div
      className={cn('size-full', className)}
      style={layerStyle}
      {...omit(props, ['form', 'index', 'canvasWidth', 'canvasHeight'])}
    />
  );
};
