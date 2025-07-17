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
  const sendExecutionStart = useMemoizedFn((workflows: MonkeyWorkflowExecution[]) => {
    console.log('[sendExecutionStart] 准备发送执行开始通知:', workflows);
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
        total: 0, // 开始时还不知道总数，设为0
      },
    });
    console.log('[sendExecutionStart] 发送的消息:', message);

    // 只发送给父窗口，和vines-execution-image-outputs保持一致
    // 添加发送前的额外检查
    console.log('[sendExecutionStart] 即将发送消息...');
    console.log('[sendExecutionStart] window.parent === window:', window.parent === window);
    console.log('[sendExecutionStart] window.top === window:', window.top === window);

    window.parent.postMessage(message, '*');

    // 验证消息是否真的被发送 - 立即发送一个测试消息到当前窗口来验证postMessage机制
    window.postMessage('test-postmessage-working', '*');

    console.log('[sendExecutionStart] 消息已发送到父窗口');
  });

  /**
   *
   * @param workflows - 工作流执行实例数组，包含instanceId、workflowId、status等信息
   * @param total - 此次任务预计生成的图片总数
   */
  const notifyExecutionStart = useMemoizedFn((workflows: MonkeyWorkflowExecution[] = [], total: number = 0) => {
    console.log('[notifyExecutionStart] 业务方调用执行开始通知:', { workflows, total });

    const message = stringify({
      'v-event': 'vines-execution-start',
      'v-data': {
        workflows,
        total,
      },
    });
    console.log('[notifyExecutionStart] 发送的消息:', message);

    // 同时发送给当前窗口和父窗口
    window.postMessage(message, '*');
    if (window.parent !== window) {
      window.parent.postMessage(message, '*');
    }

    console.log('[notifyExecutionStart] 消息已发送');
  });

  // 将函数暴露到全局，供业务方调用
  useEffect(() => {
    // 始终暴露到全局window对象，不依赖于enable参数
    (window as any).notifyExecutionStart = notifyExecutionStart;
    console.log('[useVinesIframeMessage] notifyExecutionStart函数已暴露到全局window对象');

    // 添加自动监听生成开始的机制
    const handleExecutionStart = () => {
      console.log('[useVinesIframeMessage] 检测到生成开始，自动发送vines-execution-start事件');
      notifyExecutionStart([], 0); // 开始时还不知道具体信息，使用默认值
    };

    // 监听生成按钮点击事件（通过监听表单提交事件）
    const handleFormSubmit = (event: Event) => {
      const target = event.target as HTMLElement;
      if (target && (target.tagName === 'FORM' || target.closest('form'))) {
        console.log('[useVinesIframeMessage] 检测到表单提交，可能是生成按钮点击');
        setTimeout(handleExecutionStart, 100); // 延迟一点确保事件顺序正确
      }
    };

    // 监听按钮点击事件
    const handleButtonClick = (event: Event) => {
      const target = event.target as HTMLElement;
      if (target && target.tagName === 'BUTTON') {
        const buttonText = target.textContent || '';
        if (
          buttonText.includes('生成') ||
          buttonText.includes('Generate') ||
          target.querySelector('[data-icon="sparkles"]')
        ) {
          console.log('[useVinesIframeMessage] 检测到生成按钮点击');
          handleExecutionStart();
        }
      }
    };

    document.addEventListener('submit', handleFormSubmit);
    document.addEventListener('click', handleButtonClick);

    return () => {
      // 清理时移除全局函数和事件监听器
      delete (window as any).notifyExecutionStart;
      document.removeEventListener('submit', handleFormSubmit);
      document.removeEventListener('click', handleButtonClick);
    };
  }, [notifyExecutionStart]);

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

      // 检查是否有新的RUNNING状态的任务，如果有则发送执行开始事件
      const runningTasks = outputs.filter((it) => it.status === 'RUNNING');
      if (runningTasks.length > 0) {
        console.log('[useVinesIframeMessage] 检测到新的运行中任务，自动发送执行开始事件:', runningTasks);
        const workflows = runningTasks.map((task) => ({
          instanceId: task.instanceId,
          workflowId: task.workflowId || 'unknown',
          status: task.status as MonkeyWorkflowExecutionStatus,
        }));
        notifyExecutionStart(workflows, runningTasks.length);
      }

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
          // 'v-data': msg.slice(0, 4),
          'v-data': data.slice(0, 4),
        }),
        '*',
      );
    }
  }, [enable, outputs, notifyExecutionStart]);

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
    notifyExecutionStart,
  };
};
