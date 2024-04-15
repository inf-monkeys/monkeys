import React, { useEffect } from 'react';

import { useSWRConfig } from 'swr';

import { useInterval } from '@mantine/hooks';
import { CircularProgress } from '@nextui-org/progress';

import { useVinesTasksDetail } from '@/apis/vector';

interface IActiveTaskProps {
  textId: string;
  taskId: string;
}

export const ActiveTask: React.FC<IActiveTaskProps> = ({ textId, taskId }) => {
  const { mutate } = useSWRConfig();
  const { data, mutate: taskMutate } = useVinesTasksDetail(textId, taskId);

  const currentEvent = data?.events?.length
    ? data?.events?.at(-1)
    : {
        progress: 20,
        message: '正在处理中...',
      };
  const currentProgress = (currentEvent?.progress ?? 0) * 100;

  const interval = useInterval(() => taskMutate(), 500);

  useEffect(() => {
    if (currentProgress === 100) {
      setTimeout(
        () =>
          mutate(
            (key) =>
              (typeof key === 'string' && key.startsWith(`/api/vector/collections/${textId}`)) ||
              (Array.isArray(key) &&
                key.some((k) => typeof k === 'string' && k.startsWith(`/api/vector/collections/${textId}`))),
          ),
        1000,
      );
    } else {
      interval.start();
    }

    return interval.stop;
  }, [currentProgress]);

  return (
    <>
      <CircularProgress
        className="-m-3 scale-[0.4] [&_circle:last-child]:stroke-vines-500"
        size="lg"
        aria-label="Loading..."
        value={(currentEvent?.progress ?? 0) * 100}
      />
      <span className="text-xs">{currentEvent?.message}</span>
    </>
  );
};
