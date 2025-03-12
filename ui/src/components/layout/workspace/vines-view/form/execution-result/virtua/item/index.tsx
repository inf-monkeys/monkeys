import React from 'react';

import { isArray, isObject } from 'lodash';

import { VinesAbstractVideo } from '@/components/layout/workspace/vines-view/_common/data-display/abstract/node/video.tsx';
import { VirtuaExecutionResultGridImageItem } from '@/components/layout/workspace/vines-view/form/execution-result/virtua/item/image.tsx';
import { VirtuaExecutionResultGridRawItem } from '@/components/layout/workspace/vines-view/form/execution-result/virtua/item/raw.tsx';
import { VirtuaExecutionResultGridWrapper } from '@/components/layout/workspace/vines-view/form/execution-result/virtua/item/wrapper';
import { JSONValue } from '@/components/ui/code-editor';
import { VinesWorkflowExecutionInput, VinesWorkflowExecutionOutputListItem } from '@/package/vines-flow/core/typings.ts';
import { cn } from '@/utils';

type IVinesExecutionResultImageAltCopy = {
  type: 'copy-param';
  label: string;
  data: VinesWorkflowExecutionInput[];
}

export type IVinesExecutionResultItem = VinesWorkflowExecutionOutputListItem & {
  render: {
    type: 'image' | 'video' | 'text' | 'json' | 'empty';
    data: JSONValue;
    alt?: string | string[] | { [imgUrl: string]: string } | { [imgUrl: string]: IVinesExecutionResultImageAltCopy } | undefined;
    index: number;
  };
};

interface IVirtuaExecutionResultGridItemProps {
  data: IVinesExecutionResultItem[];
}

export const VirtuaExecutionResultGridItem: React.FC<IVirtuaExecutionResultGridItemProps> = ({ data: row }) => {
  // const rowLength = row.length;

  return (
    <div className={cn(
      'grid size-full gap-2',
      'grid-auto-rows:1fr',
      'grid-cols-[repeat(auto-fit,minmax(min(200px,100%),1fr))]',
      'overflow-auto',
    )}>
      {row.map((it, i) => {
        const {
          render: { type, data, alt },
        } = it;

        const altLabel = isArray(alt) ? alt[0] : (isObject(alt?.[data as string]) ? alt?.[data as string].label : alt?.[data as string]) || alt || '';
        const altContent = isArray(alt) ? altLabel : ((isObject(alt?.[data as string]) && alt?.[data as string].type === 'copy-param') ? JSON.stringify({
          type: 'input-parameters',
          data: [
            ...it.input,
            ...alt?.[data as string].data,
          ]
        }) : alt?.[data as string]) ?? '';

        switch (type) {
          case 'image':
            return (
              <VirtuaExecutionResultGridWrapper data={it} key={i} src={data as string}>
                <VirtuaExecutionResultGridImageItem
                  src={data as string}
                  alt={
                    {
                      label: altLabel,
                      value: altContent,
                    }
                  }
                />
              </VirtuaExecutionResultGridWrapper>
            );
          case 'video':
            return (
              <VirtuaExecutionResultGridWrapper data={it} key={i} src={data as string}>
                <VinesAbstractVideo className="my-auto [&>video]:min-h-16">{data as string}</VinesAbstractVideo>
              </VirtuaExecutionResultGridWrapper>
            );
          default:
            return <VirtuaExecutionResultGridRawItem key={i} data={it} />;
        }
      })}
    </div>
  );
};
