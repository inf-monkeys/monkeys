import React, { useEffect } from 'react';

import { useSWRConfig } from 'swr';

import { useInterval } from '@mantine/hooks';
import { CircularProgress } from '@/components/ui/circular-progress';

import { useKnowledgeBaseTaskDetail } from '@/apis/vector';

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
      <CircularProgress
        className="-m-3 scale-[0.4] [&_circle:last-child]:stroke-vines-500"
        size="lg"
        aria-label="Loading..."
        value={(data?.progress ?? 0) * 100}
      />
      <span className="text-xs">{data?.latestMessage}</span>
    </>
  );
};
