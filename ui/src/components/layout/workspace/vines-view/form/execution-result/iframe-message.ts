import { useEffect, useRef } from 'react';

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
  console.log('outputs', outputs);

  // 记录已发送开始事件的任务，避免重复发送
  const sentStartEvents = useRef<Set<string>>(new Set());

  const sendExecutionStart = useMemoizedFn((workflows: MonkeyWorkflowExecution[], total: number = 0) => {
    console.log('[sendExecutionStart] 准备发送执行开始通知:', { workflows, total });
    console.log('[sendExecutionStart] 当前窗口信息:', {
      location: window.location.href,
      parent: window.parent !== window ? '有父窗口' : '无父窗口',
      origin: window.location.origin,
      hostname: window.location.hostname,
      protocol: window.location.protocol,
      port: window.location.port,
      href: window.location.href,
    });

    const message = stringify({
      'v-event': 'vines-execution-start',
      'v-data': {
        workflows,
        total, // 生成张数
      },
    });
    console.log('[sendExecutionStart] 发送的消息:', message);

    // 只发送给父窗口，和vines-execution-image-outputs保持一致
    window.parent.postMessage(message, '*');

    console.log('[sendExecutionStart] 消息已发送到父窗口');

    // 记录已发送的任务
    workflows.forEach((workflow) => {
      sentStartEvents.current.add(workflow.instanceId);
    });
  });

  // 发送生成完成更新事件
  const sendExecutionUpdate = useMemoizedFn((workflows: MonkeyWorkflowExecution[], total: number) => {
    console.log('[sendExecutionUpdate] 发送生成完成更新:', { workflows, total });

    const message = stringify({
      'v-event': 'vines-execution-update',
      'v-data': {
        workflows,
        total,
      },
    });

    window.parent.postMessage(message, '*');
    console.log('[sendExecutionUpdate] 更新事件已发送');
  });

  useEffect(() => {
    if (enable && outputs) {
      if (!outputs || outputs.length === 0) return;

      // 处理已完成的生成任务，发送更新事件
      const completedTasks = outputs.filter((it) => it.status === 'COMPLETED');
      if (completedTasks.length > 0) {
        // 计算实际生成的图片数量
        let totalImages = 0;
        completedTasks.forEach((task) => {
          if (task.output && Array.isArray(task.output)) {
            task.output.forEach((output) => {
              if (output.type === 'image') {
                totalImages++;
              }
            });
          }
        });

        if (totalImages > 0) {
          const workflows = completedTasks.map((task) => ({
            instanceId: task.instanceId,
            workflowId: task.workflowId || 'unknown',
            status: task.status as MonkeyWorkflowExecutionStatus,
          }));

          sendExecutionUpdate(workflows, totalImages);
        }
      }

      // 发送vines-execution-image-outputs事件（原有逻辑）
      const data: VinesWorkflowExecutionOutputListItemForIframe[] = outputs
        .filter((it) => it.status === 'COMPLETED')
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
          'v-data': data.slice(0, 4),
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
            console.log('[messageEvent] 收到生成按钮点击事件:', eventData);
            console.log('[messageEvent] 消息来源origin:', event.origin);
            console.log('[messageEvent] 当前页面origin:', window.location.origin);
            if (eventData?.workflows) {
              console.log('[messageEvent] 工作流数据有效，调用sendExecutionStart');
              // 从事件数据中获取预估的生成张数，如果没有则默认为0
              const total = eventData.total || 0;
              sendExecutionStart(eventData.workflows, total);
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
    sendExecutionUpdate,
  };
};
