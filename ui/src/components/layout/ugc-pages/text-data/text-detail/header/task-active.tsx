import React, { useEffect } from 'react';

import { useSWRConfig } from 'swr';

import { useKnowledgeBaseTaskDetail } from '@/apis/vector';
import { VinesLoading } from '@/components/ui/loading';
import { useInterval } from '@/hooks/use-interval.ts';

interface IActiveTaskProps {
  knowledgeBaseId: string;
  taskId: string;
}

export const ActiveTask: React.FC<IActiveTaskProps> = ({ knowledgeBaseId, taskId }) => {
  const { mutate } = useSWRConfig();
  const { data, mutate: taskMutate } = useKnowledgeBaseTaskDetail(knowledgeBaseId, taskId);

  const interval = useInterval(() => taskMutate(), 500);

  useEffect(() => {
    if (data?.progress === 100) {
      setTimeout(
        () =>
          mutate(
            (key) =>
              (typeof key === 'string' && key.startsWith(`/api/vector/collections/${knowledgeBaseId}`)) ||
              (Array.isArray(key) &&
                key.some((k) => typeof k === 'string' && k.startsWith(`/api/vector/collections/${knowledgeBaseId}`))),
          ),
        1000,
      );
    } else {
      interval.start();
    }

    return interval.stop;
  }, [data?.progress]);

  return (
    <>
      <VinesLoading value={(data?.progress ?? 0) * 100} size="sm" />
      <span className="line-clamp-1 text-xs">{data?.latestMessage}</span>
    </>
  );
};
