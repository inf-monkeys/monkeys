import React, { useEffect, useRef } from 'react';

import { isArray, isObject } from 'lodash';

import { VinesAbstractVideo } from '@/components/layout/workspace/vines-view/_common/data-display/abstract/node/video.tsx';
import { VirtuaExecutionResultGridImageItem } from '@/components/layout/workspace/vines-view/form/execution-result/virtua/item/image.tsx';
import { VirtuaExecutionResultGridRawItem } from '@/components/layout/workspace/vines-view/form/execution-result/virtua/item/raw.tsx';
import { VirtuaExecutionResultGridWrapper } from '@/components/layout/workspace/vines-view/form/execution-result/virtua/item/wrapper';
import { JSONValue } from '@/components/ui/code-editor';
import {
  VinesWorkflowExecutionInput,
  VinesWorkflowExecutionOutputListItem,
  VinesWorkflowExecutionType,
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
    status: VinesWorkflowExecutionType;
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
  itemsPerPage = 90,
}) => {
  // 使用ref来追踪上次渲染的时间，防止频繁触发loadMore
  const lastRenderTimeRef = useRef<number>(Date.now());
  const loadMoreTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 在组件挂载和数据变化时尝试触发loadMore
  useEffect(() => {
    // 防止频繁调用：只在有必要时才触发loadMore
    if (loadMore && hasMore) {
      const now = Date.now();
      // 确保距离上次加载至少有1秒间隔
      if (now - lastRenderTimeRef.current > 1000) {
        lastRenderTimeRef.current = now;

        // 清除现有的timeout
        if (loadMoreTimeoutRef.current) {
          clearTimeout(loadMoreTimeoutRef.current);
        }

        // 设置一个短暂的延迟，避免在组件初始渲染时过早加载
        loadMoreTimeoutRef.current = setTimeout(() => {
          loadMore();
          loadMoreTimeoutRef.current = null;
        }, 100);
      }
    }

    // 组件卸载时清理timeout
    return () => {
      if (loadMoreTimeoutRef.current) {
        clearTimeout(loadMoreTimeoutRef.current);
      }
    };
  }, [loadMore, hasMore, row.length]);

  return (
    <div
      className={cn(
        'grid size-full gap-2',
        'grid-auto-rows:1fr',
        'grid-cols-[repeat(auto-fit,minmax(min(200px,100%),1fr))]',
        'overflow-auto',
      )}
    >
      {row.map((it, i) => {
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
      {hasMore && (
        <div className="col-span-full flex items-center justify-center p-4">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
        </div>
      )}
    </div>
  );
};
