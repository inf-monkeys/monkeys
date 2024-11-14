import React from 'react';

import { DndContext } from '@dnd-kit/core';
import { restrictToParentElement } from '@dnd-kit/modifiers';
import { useEventEmitter, useEventListener } from 'ahooks';
import { UseFormReturn } from 'react-hook-form';

import { CaiLayer } from '@/components/layout/workspace/vines-view/form/tabular/render/field/canvas-assisted-interaction/layer';
import { CaiInteraction } from '@/components/layout/workspace/vines-view/form/tabular/render/field/canvas-assisted-interaction/layer/interaction.tsx';
import {
  ELayerDefault,
  VLayer,
} from '@/components/layout/workspace/vines-view/form/tabular/render/field/canvas-assisted-interaction/layer/use-layer.ts';
import { useFormValues } from '@/components/ui/form.tsx';
import { useElementSize } from '@/hooks/use-resize-observer.ts';
import { VinesWorkflowVariable } from '@/package/vines-flow/core/tools/typings.ts';
import { IWorkflowInputForm } from '@/schema/workspace/workflow-input-form.ts';
import { cn } from '@/utils';

interface ICanvasAssistedInteractionProps {
  id: string;
  input: VinesWorkflowVariable;
  form: UseFormReturn<IWorkflowInputForm>;
}

export const CanvasAssistedInteraction: React.FC<ICanvasAssistedInteractionProps> = ({ id, input, form }) => {
  const values = useFormValues();

  const layer = input.typeOptions?.layer as VLayer;
  const padding = layer?.padding ?? 0;

  const { ref, width, height } = useElementSize();
  const containerWidth = (width ?? 0) - padding * 2;
  const containerHeight = (height ?? 0) - padding * 2;

  const wheelEvent$ = useEventEmitter<WheelEvent>();
  useEventListener('wheel', (e: WheelEvent) => wheelEvent$.emit(e), { target: ref });

  const { ref: canvasRef, width: canvasWidth, height: canvasHeight } = useElementSize();

  const layers = layer?.layers ?? [];
  const firstIsLayer = layers?.[0]?.type === 'layer';

  return (
    <div
      ref={ref}
      className="vines-center h-72 w-full overflow-hidden rounded-lg border border-input shadow-sm"
      style={{ padding, background: layer?.background, height: layer?.height }}
    >
      <DndContext modifiers={[restrictToParentElement]}>
        <div ref={canvasRef} className={cn('relative flex', !firstIsLayer && 'size-full')}>
          {layers.map((layer, i) => {
            const Layer = layer.type === 'interaction' ? CaiInteraction : CaiLayer;
            const background = layer.background;
            return (
              <Layer
                key={i}
                id={`cai-layer-${id}-${i}`}
                index={i}
                className={cn('border border-transparent', i === 0 && layer.type === 'layer' ? 'relative' : 'absolute')}
                style={{
                  height: layer?.height ?? void 0,
                  width: layer?.width ?? void 0,
                  borderColor: layer.borderColor ?? ELayerDefault.borderColor,
                  background: background?.startsWith('http') ? `url(${background})` : background,
                  padding: layer.padding,
                  opacity: layer.opacity,
                }}
                maxWidth={containerWidth}
                maxHeight={containerHeight}
                layer={layer}
                values={values}
                canvasWidth={canvasWidth}
                canvasHeight={canvasHeight}
                form={form}
                wheelEvent$={wheelEvent$}
              />
            );
          })}
        </div>
      </DndContext>
    </div>
  );
};
