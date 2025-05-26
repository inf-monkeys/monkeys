import { useEffect, useRef } from 'react';

import { KeyedMutator } from 'swr/_internal';

import { useMemoizedFn } from 'ahooks';
import { isString, omit } from 'lodash';

import { IPaginationListData } from '@/apis/typings.ts';
import {
  VinesWorkflowExecutionOutput,
  VinesWorkflowExecutionOutputListItem,
} from '@/package/vines-flow/core/typings.ts';
import VinesEvent from '@/utils/events.ts';
import { stringify } from '@/utils/fast-stable-stringify.ts';
import { SWRInfiniteHook, SWRInfiniteResponse } from 'swr/infinite';

interface IVinesIframeMessage {
  outputs?: VinesWorkflowExecutionOutputListItem[];
  mutate:
    | KeyedMutator<IPaginationListData<VinesWorkflowExecutionOutputListItem> | undefined>
    | SWRInfiniteResponse['mutate'];

  enable?: boolean;
}

export const useVinesIframeMessage = ({ outputs, mutate, enable = false }: IVinesIframeMessage) => {
  useEffect(() => {
    if (enable && outputs) {
      const msg: (VinesWorkflowExecutionOutput & {
        instance: Omit<VinesWorkflowExecutionOutputListItem, 'output'>;
      })[] = [];
      for (const it of outputs) {
        if (msg.length > 4) break;
        if (it.status !== 'COMPLETED') continue;

        for (const result of it.output) {
          if (result.type !== 'image') continue;
          msg.push({
            ...result,
            instance: omit(it, 'output'),
          });
        }

        break;
      }

      window.parent.postMessage(
        stringify({
          'v-event': 'vines-execution-image-outputs',
          'v-data': msg.slice(0, 4),
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
};
