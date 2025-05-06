import React from 'react';

import { CirclePause } from 'lucide-react';

import { VinesAbstractDataPreview } from '@/components/layout/workspace/vines-view/_common/data-display/abstract';
import { VirtuaExecutionResultGridImageItem } from '@/components/layout/workspace/vines-view/form/execution-result/virtua/item/image.tsx';
import { VirtuaExecutionResultGridWrapper } from '@/components/layout/workspace/vines-view/form/execution-result/virtua/item/wrapper';
import { VinesLoading } from '@/components/ui/loading';
import { getAlt } from '@/utils';
import { IVinesExecutionResultItem } from '@/utils/execution.ts';

export const ExecutionResultItem: React.FC<IVinesExecutionResultItem> = (result) => {
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
          <VirtuaExecutionResultGridWrapper data={result} src={data as string}>
            <div className="h-full w-full" onClick={(e) => e.stopPropagation()}>
              <VirtuaExecutionResultGridImageItem src={data as string} alt={alt} />
            </div>
          </VirtuaExecutionResultGridWrapper>
        </div>
      );
    default:
      return (
        <VirtuaExecutionResultGridWrapper data={result}>
          <div className="min-h-40 overflow-hidden rounded-lg border border-input p-2 shadow-sm">
            <VinesAbstractDataPreview data={data} className="h-full" />
          </div>
        </VirtuaExecutionResultGridWrapper>
      );
  }
};
