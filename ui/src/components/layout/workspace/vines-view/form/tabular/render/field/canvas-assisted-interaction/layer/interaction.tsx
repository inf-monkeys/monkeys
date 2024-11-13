import React, { CSSProperties, useEffect, useRef } from 'react';

import { DragEndEvent, DragMoveEvent, useDndMonitor, useDraggable } from '@dnd-kit/core';
import { useCreation, useSetState } from 'ahooks';
import { isUndefined, omit } from 'lodash';
import { UseFormReturn } from 'react-hook-form';

import {
  IUseLayerOptions,
  useLayer,
} from '@/components/layout/workspace/vines-view/form/tabular/render/field/canvas-assisted-interaction/layer/use-layer.ts';
import { calculatePosition } from '@/components/layout/workspace/vines-view/form/tabular/render/field/canvas-assisted-interaction/utils.ts';
import { VinesLucideIcon } from '@/components/ui/vines-icon/lucide';
import { VinesImage } from '@/components/ui/vines-image';
import { IWorkflowInputForm } from '@/schema/workspace/workflow-input-form.ts';
import { cn } from '@/utils';

interface ICaiInteractionProps extends React.ComponentPropsWithoutRef<'div'>, Omit<IUseLayerOptions, 'style'> {
  index: number;
  form: UseFormReturn<IWorkflowInputForm>;

  canvasWidth: number;
  canvasHeight: number;
}

export const CaiInteraction: React.FC<ICaiInteractionProps> = ({
  layer,
  values,
  className,
  style,
  maxWidth,
  maxHeight,
  index,
  canvasWidth,
  canvasHeight,
  form,
  ...props
}) => {
  const { layerStyle, layerValues, layerMapper } = useLayer({
    layer,
    values,
    maxWidth,
    maxHeight,
    style,
  });

  const layerInsertMapper = useCreation(
    () => (layer.insertMapper ? Object.entries(layer.insertMapper) : null),
    [layer.insertMapper],
  );

  const [{ x, y }, setCoordinates] = useSetState<{ x?: number; y?: number }>({});

  const isMovingRef = useRef(false);
  useDndMonitor({
    onDragStart() {
      isMovingRef.current = true;
    },
    onDragEnd({ delta }: DragEndEvent) {
      isMovingRef.current = false;
      setCoordinates((prev) => ({
        x: (prev.x ?? 0) + delta.x,
        y: (prev.y ?? 0) + delta.y,
      }));
    },
    onDragMove({ delta }: DragMoveEvent) {
      if (layerInsertMapper) {
        const translateXKeys = layerInsertMapper.find(([value]) => value.includes('translateX'))?.[1];
        const translateYKeys = layerInsertMapper.find(([value]) => value.includes('translateY'))?.[1];

        if (isUndefined(translateXKeys) || isUndefined(translateYKeys)) {
          return;
        }

        const xParams = layer.valueTypeOptions?.[translateXKeys?.[0] ?? '']?.number;
        const yParams = layer.valueTypeOptions?.[translateYKeys?.[0] ?? '']?.number;

        const { x: elementX, y: elementY } = calculatePosition({
          canvasWidth,
          canvasHeight,
          X: (x ?? 0) + delta.x,
          Y: (y ?? 0) + delta.y,
          xParams,
          yParams,
        });

        if (elementX) {
          for (const key of translateXKeys) {
            form.setValue(key, elementX);
          }
        }
        if (elementY) {
          for (const key of translateYKeys) {
            form.setValue(key, elementY);
          }
        }
      }
    },
  });

  useEffect(() => {
    if (isMovingRef.current) return;
    const translateX = layerValues?.translateX;
    const translateY = layerValues?.translateY;
    if (translateX || translateY) {
      const translateXKeys = layerMapper?.find(([, value]) => value.includes('translateX'))?.[0];
      const translateYKeys = layerMapper?.find(([, value]) => value.includes('translateY'))?.[0];

      const xParams = layer.valueTypeOptions?.[translateXKeys ?? '']?.number;
      const yParams = layer.valueTypeOptions?.[translateYKeys ?? '']?.number;

      const { canvasX, canvasY } = calculatePosition({
        canvasWidth,
        canvasHeight,
        valueX: translateX,
        valueY: translateY,
        xParams,
        yParams,
      });

      setCoordinates({
        ...(canvasX && { x: canvasX }),
        ...(canvasY && { y: canvasY }),
      });
    }
  }, [layerValues]);

  const { setNodeRef, transform, listeners, attributes } = useDraggable({
    id: props.id || 'cai-interaction',
    data: {
      index,
    },
  });

  const dragStyle = {
    ...(transform && { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }),
    top: y,
    left: x,
  } as CSSProperties;

  return (
    <div ref={setNodeRef} className="vines-center absolute" style={dragStyle} {...omit(props, ['form'])}>
      <div
        className={cn('vines-center absolute cursor-grab', className)}
        style={layerStyle}
        {...listeners}
        {...attributes}
      >
        {layerValues.icon && <VinesLucideIcon src={layerValues.icon} />}
        {layerValues.image && <VinesImage src={layerValues.image} disabledPreview />}
      </div>
    </div>
  );
};
