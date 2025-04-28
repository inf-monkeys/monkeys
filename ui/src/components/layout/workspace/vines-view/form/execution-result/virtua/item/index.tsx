import React, { useCallback, useEffect, useRef, useState } from 'react';

import { isArray, isObject } from 'lodash';

import { VinesAbstractVideo } from '@/components/layout/workspace/vines-view/_common/data-display/abstract/node/video.tsx';
import { VirtuaExecutionResultGridImageItem } from '@/components/layout/workspace/vines-view/form/execution-result/virtua/item/image.tsx';
import { VirtuaExecutionResultGridRawItem } from '@/components/layout/workspace/vines-view/form/execution-result/virtua/item/raw.tsx';
import { VirtuaExecutionResultGridWrapper } from '@/components/layout/workspace/vines-view/form/execution-result/virtua/item/wrapper';
import { JSONValue } from '@/components/ui/code-editor';
import {
  VinesWorkflowExecutionInput,
  VinesWorkflowExecutionOutputListItem,
} from '@/package/vines-flow/core/typings.ts';
import { cn } from '@/utils';

type IVinesExecutionResultImageAltCopy = {
  type: 'copy-param';
  label: string;
  data: VinesWorkflowExecutionInput[];
};

export type IVinesExecutionResultItem = VinesWorkflowExecutionOutputListItem & {
  render: {
    type: 'image' | 'video' | 'text' | 'json' | 'empty';
    data: JSONValue;
    alt?:
    | string
    | string[]
    | { [imgUrl: string]: string }
    | {
      [imgUrl: string]: IVinesExecutionResultImageAltCopy;
    }
    | undefined;
    index: number;
  };
};

interface IVirtuaExecutionResultGridItemProps {
  data: IVinesExecutionResultItem[];
  // 新增参数，用于支持无限滚动
  loadMore?: () => void;
  hasMore?: boolean;
  itemsPerPage?: number;
}

export const VirtuaExecutionResultGridItem: React.FC<IVirtuaExecutionResultGridItemProps> = ({
  data: row,
  loadMore,
  hasMore = false,
  itemsPerPage = 40
}) => {
  // 使用useState管理当前显示的项目数量
  const [visibleItems, setVisibleItems] = useState(itemsPerPage);
  // 用于监听滚动容器的引用
  const containerRef = useRef<HTMLDivElement>(null);
  // 用于标记加载状态，防止多次触发加载
  const [isLoading, setIsLoading] = useState(false);

  // 监听滚动事件的处理函数
  const handleScroll = useCallback(() => {
    if (!containerRef.current || isLoading) return;

    const container = containerRef.current;
    // 当滚动到距离底部100px时触发加载更多
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;

    if (isNearBottom && loadMore && hasMore) {
      setIsLoading(true);
      loadMore();
      setIsLoading(false);
    } else if (isNearBottom && visibleItems < row.length) {
      // 如果没有提供loadMore函数但有更多本地数据，增加显示数量
      setVisibleItems(prev => Math.min(prev + itemsPerPage, row.length));
    }
  }, [loadMore, hasMore, isLoading, visibleItems, row.length, itemsPerPage]);

  // 设置滚动监听
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('scroll', handleScroll);
    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, [handleScroll]);

  // 获取当前需要渲染的数据
  const visibleData = row.slice(0, visibleItems);

  return (
    <div
      ref={containerRef}
      className={cn(
        'grid size-full gap-2',
        'grid-auto-rows:1fr',
        'grid-cols-[repeat(auto-fit,minmax(min(200px,100%),1fr))]',
        'overflow-auto',
      )}
    >
      {visibleData.map((it, i) => {
        const {
          render: { type, data, alt },
        } = it;

        const altLabel = isArray(alt)
          ? alt[0]
          : (isObject(alt?.[data as string]) ? alt?.[data as string].label : alt?.[data as string]) || alt || '';
        const altContent = isArray(alt)
          ? altLabel
          : (isObject(alt?.[data as string]) && alt?.[data as string].type === 'copy-param'
            ? JSON.stringify({
              type: 'input-parameters',
              data: [...it.input, ...alt?.[data as string].data],
            })
            : alt?.[data as string]) ?? '';

        switch (type) {
          case 'image':
            return (
              <VirtuaExecutionResultGridWrapper data={it} key={i} src={data as string}>
                <VirtuaExecutionResultGridImageItem
                  src={data as string}
                  alt={{
                    label: altLabel,
                    value: altContent,
                  }}
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

      {/* 添加底部加载指示器 */}
      {(hasMore || visibleItems < row.length) && (
        <div className="col-span-full flex items-center justify-center p-4">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
        </div>
      )}
    </div>
  );
};
