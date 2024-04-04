import React, { useEffect, useRef, useState } from 'react';

import { CircularProgress } from '@nextui-org/progress';
import dayjs from 'dayjs';
import equal from 'fast-deep-equal/es6';
import { omit } from 'lodash';

import { useSearchWorkflowExecutions } from '@/apis/workflow/execution';
import { IVinesChatListItem } from '@/components/layout/vines-view/chat/messages/typings.ts';
import { VirtualizedList } from '@/components/layout/vines-view/chat/messages/virtualized';
import { useVinesUser } from '@/components/router/guard/user.tsx';
import { useVinesFlow } from '@/package/vines-flow';
import { VinesWorkflowVariable } from '@/package/vines-flow/core/tools/typings.ts';
import { useLocalStorage } from '@/utils';

interface IVinesChatListProps {
  visible: boolean;
  workflowId: string;
}

export const VinesChatList: React.FC<IVinesChatListProps> = ({ workflowId }) => {
  const { userPhoto, userName } = useVinesUser();
  const { vines } = useVinesFlow();

  const [sessions] = useLocalStorage<Record<string, string>>('vines-ui-chat-session', {});

  const { data, isLoading } = useSearchWorkflowExecutions(
    workflowId
      ? {
          orderBy: { filed: 'startTime', order: 'DESC' },
          pagination: { page: 1, limit: 100 },
          workflowId,
          ...(sessions[workflowId] ? { chatSessionIds: [sessions[workflowId]] } : {}),
        }
      : null,
  );

  const [list, setList] = useState<IVinesChatListItem[] | undefined>();

  const prevData = useRef<IVinesChatListItem[]>([]);

  const executionData = data?.data;
  useEffect(() => {
    const dirtyData =
      executionData
        ?.filter((it) => !it.tasks?.length)
        ?.map(
          ({ workflowId, output, input, status, startTime, endTime }) =>
            ({
              instanceId: workflowId!,
              output,
              input,
              status,
              startTime,
              endTime,
            }) as unknown as IVinesChatListItem,
        ) ?? [];

    if (equal(prevData.current, dirtyData)) return;
    prevData.current = dirtyData;

    const workingList = executionData?.filter(({ status }) => ['RUNNING', 'PAUSED'].includes(status ?? ''));
    if (workingList?.length) {
      vines.swapExecutionInstance(workingList[0]);
    }

    const newList: IVinesChatListItem[] = [];

    const vinesWorkflowInput = vines.workflowInput;
    const botPhoto = vines.workflowIcon;
    for (const it of dirtyData.toReversed()) {
      const originalInput = omit(it.input, ['__context']);
      const input = vinesWorkflowInput
        .map((it) => ({ ...it, default: originalInput[it.name] }))
        .filter((it) => it.default) as unknown as VinesWorkflowVariable[];

      newList.push({
        ...it,
        input,
        originalInput,
        userPhoto,
        userName,
        botPhoto,
        startTime: dayjs(it.startTime).format('YY-MM-DD HH:mm:ss'),
        endTime: dayjs(it.endTime).format('YY-MM-DD HH:mm:ss'),
      });
    }

    setList(newList);
  }, [executionData]);

  return isLoading && !list ? (
    <div className="vines-center size-full">
      <CircularProgress className="[&_circle:last-child]:stroke-vines-500" size="lg" aria-label="Loading..." />
    </div>
  ) : (
    list && <VirtualizedList data={list} />
  );
};
