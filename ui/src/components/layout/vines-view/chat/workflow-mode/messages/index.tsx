import React, { useEffect, useRef, useState } from 'react';

import { CircularProgress } from '@nextui-org/progress';
import dayjs from 'dayjs';
import equal from 'fast-deep-equal/es6';
import { AnimatePresence, motion } from 'framer-motion';
import { omit } from 'lodash';
import { MessageSquareDashed } from 'lucide-react';

import { useSearchWorkflowExecutions } from '@/apis/workflow/execution';
import { IVinesChatListItem } from '@/components/layout/vines-view/chat/workflow-mode/messages/typings.ts';
import { VirtualizedList } from '@/components/layout/vines-view/chat/workflow-mode/messages/virtualized';
import { useVinesUser } from '@/components/router/guard/user.tsx';
import { useVinesFlow } from '@/package/vines-flow';
import { VinesWorkflowVariable } from '@/package/vines-flow/core/tools/typings.ts';
import { useViewStore } from '@/store/useViewStore';
import { useLocalStorage } from '@/utils';

interface IVinesChatListProps {
  visible: boolean;
  workflowId: string;
}

export const VinesChatList: React.FC<IVinesChatListProps> = ({ workflowId }) => {
  const { visible } = useViewStore();
  const { userPhoto, userName } = useVinesUser();
  const { vines } = useVinesFlow();

  const [sessions] = useLocalStorage<Record<string, string>>('vines-ui-chat-session', {});

  const { data, isLoading } = useSearchWorkflowExecutions(
    workflowId && visible
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
    for (const it of dirtyData.slice().reverse()) {
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

  return (
    <AnimatePresence>
      {isLoading && !list ? (
        <motion.div
          key="vines-chat-loading"
          className="vines-center size-full"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <CircularProgress className="[&_circle:last-child]:stroke-vines-500" size="lg" aria-label="Loading..." />
        </motion.div>
      ) : list?.length ? (
        <motion.div
          key="vines-chat-context"
          className="size-full"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, delay: 0.35 }}
        >
          <VirtualizedList data={list} />
        </motion.div>
      ) : (
        <motion.div
          key="vines-chat-empty"
          className="vines-center size-full flex-col"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { delay: 0.3 } }}
          transition={{ duration: 0.2 }}
        >
          <MessageSquareDashed size={64} />
          <div className="mt-4 flex flex-col text-center">
            <h2 className="font-bold">暂无对话</h2>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
