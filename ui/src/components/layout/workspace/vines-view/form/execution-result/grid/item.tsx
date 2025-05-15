import React from 'react';

import type { EventEmitter } from 'ahooks/lib/useEventEmitter';
import { CirclePause } from 'lucide-react';

import { VinesAbstractDataPreview } from '@/components/layout/workspace/vines-view/_common/data-display/abstract';
import { VinesLoading } from '@/components/ui/loading';
import { getAlt } from '@/utils';
import { IVinesExecutionResultItem } from '@/utils/execution.ts';

import { VirtuaExecutionResultGridImageItem } from '../virtua/item/image';
import { VirtuaExecutionResultGridWrapper } from '../virtua/item/wrapper';

interface IExecutionResultItemProps {
  result: IVinesExecutionResultItem;
  event$: EventEmitter<void>;
}

export const ExecutionResultItem: React.FC<IExecutionResultItemProps> = ({ result, event$ }) => {
  const { render } = result;
  const { type, data, status } = render;

  const alt = getAlt(result);

  switch (status) {
    case 'SCHEDULED':
    case 'RUNNING':
      return (
        <div
          key={render.key}
          className="flex h-40 items-center justify-center rounded-lg border border-input shadow-sm"
        >
          <VinesLoading />
        </div>
      );
    case 'PAUSED':
      return (
        <div
          key={render.key}
          className="flex h-40 items-center justify-center rounded-lg border border-input shadow-sm"
        >
          <CirclePause className="stroke-yellow-12" size={48} />
        </div>
      );
  }

  switch (type) {
    case 'image':
      // 使用包装组件来支持下载和删除功能
      return (
        <div className="relative overflow-hidden rounded-lg border border-input shadow-sm">
          <VirtuaExecutionResultGridWrapper data={result} src={data as string} event$={event$}>
            <div className="h-full w-full" onClick={(e) => e.stopPropagation()}>
              <VirtuaExecutionResultGridImageItem src={data as string} alt={alt} instanceId={result.instanceId} />
            </div>
          </VirtuaExecutionResultGridWrapper>
        </div>
      );
    default:
      return (
        <div className="relative overflow-hidden rounded-lg border border-input shadow-sm">
          <VirtuaExecutionResultGridWrapper data={result} event$={event$}>
            <div className="max-h-96 min-h-40 overflow-auto p-2">
              <VinesAbstractDataPreview data={data} className="h-full" />
            </div>
          </VirtuaExecutionResultGridWrapper>
        </div>
      );
  }
};
