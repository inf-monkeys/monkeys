import React from 'react';

import { VinesAbstractVideo } from '@/components/layout/workspace/vines-view/_common/data-display/abstract/node/video.tsx';
import { VirtuaExecutionResultGridImageItem } from '@/components/layout/workspace/vines-view/form/execution-result/virtua/item/image.tsx';
import { VirtuaExecutionResultGridRawItem } from '@/components/layout/workspace/vines-view/form/execution-result/virtua/item/raw.tsx';
import { VirtuaExecutionResultGridWrapper } from '@/components/layout/workspace/vines-view/form/execution-result/virtua/item/wrapper';
import { JSONValue } from '@/components/ui/code-editor';
import { VinesWorkflowExecution } from '@/package/vines-flow/core/typings.ts';
import { cn } from '@/utils';

export type IVinesExecutionResultItem = VinesWorkflowExecution & {
  render: {
    type: 'image' | 'video' | 'raw' | 'empty';
    data: JSONValue;
  };
};

interface IVirtuaExecutionResultGridItemProps {
  data: IVinesExecutionResultItem[];
}

export const VirtuaExecutionResultGridItem: React.FC<IVirtuaExecutionResultGridItemProps> = ({ data: row }) => {
  const rowLength = row.length;

  return (
    <div
      className={cn(
        'grid w-full items-center',
        rowLength > 2 ? 'grid-cols-3' : rowLength === 2 ? 'grid-cols-2' : 'grid-cols-1',
      )}
    >
      {row.map((it, i) => {
        const {
          render: { type, data },
        } = it;

        switch (type) {
          case 'image':
            return (
              <VirtuaExecutionResultGridWrapper data={it}>
                <VirtuaExecutionResultGridImageItem key={i} src={data as string} />
              </VirtuaExecutionResultGridWrapper>
            );
          case 'video':
            return (
              <VirtuaExecutionResultGridWrapper data={it}>
                <VinesAbstractVideo key={i} className="my-auto [&>video]:min-h-16">
                  {data as string}
                </VinesAbstractVideo>
              </VirtuaExecutionResultGridWrapper>
            );
          default:
            return <VirtuaExecutionResultGridRawItem key={i} data={it} />;
        }
      })}
    </div>
  );
};