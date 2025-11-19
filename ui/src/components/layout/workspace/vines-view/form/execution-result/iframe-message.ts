import { useEffect, useRef, useState } from 'react';

import { KeyedMutator } from 'swr/_internal';
import { SWRInfiniteResponse } from 'swr/infinite';

import { useMemoizedFn } from 'ahooks';
import { isString } from 'lodash';

import { IPaginationListData } from '@/apis/typings.ts';
import {
  VinesWorkflowExecutionOutputListItem,
  VinesWorkflowExecutionOutputListItemForIframe,
} from '@/package/vines-flow/core/typings.ts';
import VinesEvent from '@/utils/events.ts';
import { stringify } from '@/utils/fast-stable-stringify.ts';

type MonkeyWorkflowExecutionStatus = 'COMPLETED' | 'RUNNING' | 'FAILED' | 'TERMINATED' | 'PAUSED' | 'UNKNOWN';

interface MonkeyWorkflowExecution {
  instanceId: string;
  workflowId: string;
  status: MonkeyWorkflowExecutionStatus;
  [key: string]: any;
}

interface IVinesIframeMessage {
  outputs?: VinesWorkflowExecutionOutputListItem[];
  mutate:
    | KeyedMutator<IPaginationListData<VinesWorkflowExecutionOutputListItem> | undefined>
    | SWRInfiniteResponse['mutate'];

  enable?: boolean;
}

export const useVinesIframeMessage = ({ outputs, mutate, enable = false }: IVinesIframeMessage) => {
  // console.log('outputs', outputs);
  const [lastOutputsLength, setLastOutputsLength] = useState(0);

  const sendExecutionStart = useMemoizedFn((workflows: MonkeyWorkflowExecution[]) => {
    const message = stringify({
      'v-event': 'vines-execution-start',
      'v-data': {
        workflows,
        total: 0, // 开始时还不知道总数，设为0
      },
    });
    // 只发送给父窗口，和vines-execution-image-outputs保持一致
    window.parent.postMessage(message, '*');
  });

  useEffect(() => {
    if (enable && outputs) {
      // const msg: (VinesWorkflowExecutionOutput & {
      //   instance: Omit<VinesWorkflowExecutionOutputListItem, 'output'>;
      // })[] = [];
      // for (const it of outputs) {
      //   if (msg.length > 4) break;
      //   if (it.status !== 'COMPLETED') continue;

      //   for (const result of it.output) {
      //     if (result.type !== 'image') continue;
      //     msg.push({
      //       ...result,
      //       instance: omit(it, 'output'),
      //     });
      //   }

      //   break;
      // }
      if (!outputs || outputs.length === 0) return;

      // 检查是否有新增的任务，只在第一次出现新任务时发送执行开始事件
      if (outputs.length > lastOutputsLength) {
        const newTasks = outputs.slice(lastOutputsLength); // 只取新增的任务
        // console.log('[useVinesIframeMessage] 检测到新增任务，发送执行开始事件:', newTasks);

        const workflows = newTasks.map((task) => ({
          instanceId: task.instanceId,
          workflowId: task.workflowId || 'unknown',
          status: task.status as MonkeyWorkflowExecutionStatus,
        }));

        const message = stringify({
          'v-event': 'vines-execution-start',
          'v-data': {
            workflows,
            total: 0, // 开始时还不知道总数，设为0
          },
        });
        // console.log('[useVinesIframeMessage] 发送vines-execution-start事件:', message);
        window.parent.postMessage(message, '*');

        // 更新记录的长度
        setLastOutputsLength(outputs.length);
      }

      const data: VinesWorkflowExecutionOutputListItemForIframe[] = outputs
        // .filter((it) => it.status === 'COMPLETED')
        .slice(0, 4)
        .map(
          ({
            instanceId,
            render: _render,
            startTime: _startTime,
            endTime: _endTime,
            teamId: _teamId,
            updateTime: _updateTime,
            userId: _userId,
            ...it
          }) => ({
            workflowInstanceId: instanceId,
            ...it,
          }),
        );
      if (data.length === 0) return;

      window.parent.postMessage(
        stringify({
          'v-event': 'vines-execution-image-outputs',
          // 'v-data': msg.slice(0, 4),
          'v-data': data.slice(0, 16),
        }),
        '*',
      );
    }
  }, [enable, outputs]);

  const messageListened = useRef(false);
  const messageEvent = useMemoizedFn((event: MessageEvent<any>) => {
    try {
      const data = JSON.parse(event.data);
      const eventName = data?.['v-event'];
      const eventData = data?.['v-data'];
      if (eventName && isString(eventName)) {
        switch (eventName) {
          case 'vines-get-execution-outputs':
            mutate().then((it) =>
              window.parent.postMessage(
                stringify({
                  'v-event': 'vines-execution-outputs',
                  'v-data': it,
                }),
              ),
            );
            break;
          case 'vines-fill-parameters-with-image-url':
            if (eventData) {
              VinesEvent.emit('view-toggle-active-view-by-workflow-id', data?.['v-workflow-id']);
              VinesEvent.emit(
                'form-fill-data-by-image-url',
                eventData,
                data?.['v-workflow-id'],
                data?.['v-auto-produce'],
              );
            } else {
              console.error('[VinesIframeEmbed]: received invalid iframe message v-data');
            }
            break;
          case 'vines-generate-button-clicked':
            if (eventData?.workflows) {
              sendExecutionStart(eventData.workflows);
            } else {
              console.error('[VinesIframeEmbed]: received invalid generation data');
            }
            break;
          default:
            console.error('[VinesIframeEmbed]: received unsupported iframe message v-event name:', eventName);
            break;
        }
      }
    } catch {
      /* empty */
    }
  });

  useEffect(() => {
    if (enable && !messageListened.current) {
      window.addEventListener('message', messageEvent);
      messageListened.current = true;
    } else {
      window.removeEventListener('message', messageEvent);
      messageListened.current = false;
    }
  }, [enable]);

  return {
    sendExecutionStart,
  };
};
