import React, { useEffect, useRef, useState } from 'react';

import { useDocumentVisibility, useInterval, useNetwork } from '@mantine/hooks';
import dayjs from 'dayjs';
import equal from 'fast-deep-equal/es6';
import { omit } from 'lodash';

import { useSearchWorkflowExecutions } from '@/apis/workflow/execution';
import { IVinesChatListItem } from '@/components/layout/view/vines-chat/chat-list/typings.ts';
import { VirtualizedList } from '@/components/layout/view/vines-chat/chat-list/virtualized';
import { useVinesUser } from '@/components/router/guard/user.tsx';
import { useVinesFlow } from '@/package/vines-flow';
import { VinesWorkflowVariable } from '@/package/vines-flow/core/tools/typings.ts';
import { readLocalStorageValue, useLocalStorage } from '@/utils';

interface IVinesChatListProps {
  visible: boolean;
  workflowId: string;
}

export const VinesChatList: React.FC<IVinesChatListProps> = ({ visible, workflowId }) => {
  const { userPhoto, userName } = useVinesUser();
  const { vines } = useVinesFlow();
  const { data, trigger } = useSearchWorkflowExecutions();

  const [localChatSessions] = useLocalStorage<Record<string, string>>('vines-ui-chat-session', {});

  const handleUpdateList = () => {
    const sessions = readLocalStorageValue<Record<string, string>>('vines-ui-chat-session', {});
    void trigger({
      orderBy: { filed: 'startTime', order: 'DESC' },
      pagination: { page: 1, limit: 100 },
      workflowId,
      ...(sessions[workflowId] ? { chatSessionIds: [sessions[workflowId]] } : {}),
    });
  };

  const networkStatus = useNetwork();
  const documentState = useDocumentVisibility();
  const interval = useInterval(handleUpdateList, 1500);

  useEffect(() => {
    if (networkStatus.online && documentState === 'visible' && visible) {
      interval.start();
    } else {
      interval.stop();
    }
    return () => {
      interval.stop();
    };
  }, [documentState, networkStatus, visible]);

  useEffect(() => {
    visible && handleUpdateList();
  }, [visible, localChatSessions]);

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

  return list && <VirtualizedList data={list} />;
};
