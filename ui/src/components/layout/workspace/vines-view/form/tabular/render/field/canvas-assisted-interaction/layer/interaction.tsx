import React, { CSSProperties, useEffect, useRef } from 'react';

import { DragEndEvent, DragMoveEvent, useDndMonitor, useDraggable } from '@dnd-kit/core';
import { useCreation, useEventListener, useMemoizedFn, useSetState } from 'ahooks';
import type { EventEmitter } from 'ahooks/lib/useEventEmitter';
import { isUndefined, omit, pick } from 'lodash';
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

  wheelEvent$?: EventEmitter<WheelEvent>;
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
  wheelEvent$,
  ...props
}) => {
  const { layerStyle, layerValues } = useLayer({
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
        const translateXKeys = layerValues?.translateX?.targets;
        const translateYKeys = layerValues?.translateY?.targets;

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
    if (typeof translateX !== 'undefined' && typeof translateY !== 'undefined') {
      const xParams = layer.valueTypeOptions?.[translateX.targets?.[0] ?? '']?.number;
      const yParams = layer.valueTypeOptions?.[translateY.targets?.[0] ?? '']?.number;

      const { canvasX, canvasY } = calculatePosition({
        canvasWidth,
        canvasHeight,
        valueX: translateX.value as number,
        valueY: translateY.value as number,
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

  const handelWheel = useMemoizedFn((e: WheelEvent, disabledWheel = false) => {
    if (disabledWheel && !e.ctrlKey) return;

    const scaleValue = layerValues.scale;
    const updateTargetKeys = scaleValue?.targets ?? [];
    if (typeof scaleValue !== 'undefined' && updateTargetKeys.length) {
      const scaleParams = layer.valueTypeOptions?.[scaleValue.targets?.[0] ?? '']?.number;
      // scaleParams: {max: 2, min: 0, step: 0.001}
      const minScale = scaleParams?.min ?? -Infinity;
      const maxScale = scaleParams?.max ?? Infinity;
      const stepScale = scaleParams?.step ?? 0.015;

      //=> 处理手势缩放 | 操作时会自动把 ctrlKey 设置为 true
      e.stopPropagation();
      e.preventDefault();

      let finalScale = (scaleValue.value as number) ?? 1;
      finalScale += -e.deltaY * stepScale;
      finalScale = parseFloat(finalScale.toFixed(3));

      if (finalScale >= minScale && finalScale <= maxScale) {
        for (const targetKey of updateTargetKeys) {
          form.setValue(targetKey, finalScale);
        }
      }
      return;
    }
  });

  const ref = useRef<HTMLDivElement>(null);
  useEventListener('wheel', handelWheel, { target: ref });
  wheelEvent$?.useSubscription((e) => handelWheel(e, true));

  return (
    <div ref={setNodeRef} className="vines-center absolute" style={dragStyle} {...omit(props, ['setLayerScale'])}>
      <div
        ref={ref}
        className={cn('vines-center absolute cursor-grab', className)}
        style={layerStyle}
        {...listeners}
        {...attributes}
      >
        {layerValues.icon && <VinesLucideIcon src={layerValues.icon.value as string} />}
        {layerValues.image && (
          <VinesImage
            src={layerValues.image.value as string}
            imageStyle={pick(layerStyle, ['width', 'height'])}
            disabledPreview
          />
        )}
      </div>
    </div>
  );
};
