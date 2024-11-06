import React, { useEffect, useRef, useState } from 'react';

import dayjs from 'dayjs';
import equal from 'fast-deep-equal/es6';
import { AnimatePresence, motion } from 'framer-motion';
import { omit } from 'lodash';
import { MessageSquareDashed } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useSearchWorkflowExecutions } from '@/apis/workflow/execution';
import { IVinesChatListItem } from '@/components/layout/workspace/vines-view/chat/workflow-mode/typings.ts';
import { VirtuaWorkflowChatMessages } from '@/components/layout/workspace/vines-view/chat/workflow-mode/virtua-messages';
import { useVinesUser } from '@/components/router/guard/user.tsx';
import { VinesLoading } from '@/components/ui/loading';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { useVinesFlow } from '@/package/vines-flow';
import { VinesWorkflowVariable } from '@/package/vines-flow/core/tools/typings.ts';
import { useViewStore } from '@/store/useViewStore';

interface IVinesChatListProps {
  workflowId: string;
  height: number;
  useSimple?: boolean;
}

export const VinesChatList: React.FC<IVinesChatListProps> = ({ workflowId, height, useSimple }) => {
  const { t } = useTranslation();

  const visible = useViewStore((s) => s.visible);

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
        ?.filter((it) => !it.tasks?.length && it.workflowVersion !== -1)
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

    if (!useSimple) {
      const workingList = executionData?.filter(({ status }) => ['RUNNING', 'PAUSED'].includes(status ?? ''));
      if (workingList?.length) {
        vines.swapExecutionInstance(workingList[0], true);
      }
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
        endTime: dayjs(it.endTime || it.startTime).format('YY-MM-DD HH:mm:ss'),
      });
    }

    setList(newList);
  }, [executionData, useSimple]);

  const hasMessages = list?.length;

  return (
    <>
      <AnimatePresence mode="popLayout">
        {isLoading && !list ? (
          <motion.div
            key="vines-chat-loading"
            className="vines-center size-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <VinesLoading />
          </motion.div>
        ) : hasMessages ? (
          <motion.div
            key="vines-chat-context"
            className="size-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 0.2 }}
          >
            <VirtuaWorkflowChatMessages data={list} height={height} useSimple={useSimple} />
          </motion.div>
        ) : (
          <motion.div
            key="vines-chat-empty"
            className="vines-center size-full flex-col"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { delay: 0.3 } }}
            exit={{ opacity: 0 }}
          >
            <MessageSquareDashed size={64} />
            <div className="mt-4 flex flex-col text-center">
              <h2 className="font-bold">{t('workspace.chat-view.empty')}</h2>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
