import { useEffect, useRef } from 'react';

import { KeyedMutator } from 'swr/_internal';

import { useMemoizedFn } from 'ahooks';
import { isString, omit } from 'lodash';

import { VinesWorkflowExecutionOutput, VinesWorkflowExecutionOutputs } from '@/package/vines-flow/core/typings.ts';
import { stringify } from '@/utils/fast-stable-stringify.ts';

interface IVinesIframeMessage {
  output?: VinesWorkflowExecutionOutputs[];
  mutate: KeyedMutator<VinesWorkflowExecutionOutputs[] | undefined>;

  enable?: boolean;
}

export const useVinesIframeMessage = ({ output, mutate, enable = false }: IVinesIframeMessage) => {
  useEffect(() => {
    if (enable && output) {
      const msg: (VinesWorkflowExecutionOutput & {
        instance: Omit<VinesWorkflowExecutionOutputs, 'output'>;
      })[] = [];
      for (const it of output) {
        if (msg.length > 4) break;
        if (it.status !== 'COMPLETED') continue;

        for (const result of it.output) {
          if (result.type !== 'image') continue;
          msg.push({
            ...result,
            instance: omit(it, 'output'),
          });
        }
      }

      window.parent.postMessage(stringify(msg.slice(0, 4)), '*');
    }
  }, [enable, output]);

  const messageListened = useRef(false);
  const messageEvent = useMemoizedFn((event: MessageEvent<any>) => {
    try {
      const data = JSON.parse(event.data);
      const eventName = data?.['v-event'];
      if (eventName && isString(eventName)) {
        switch (eventName) {
          case 'vines-get-execution-outputs':
            void mutate();
            break;
          case 'vines-fill-parameters-with-image-url':
            console.warn('[VinesIframeEmbed]: this v-event is not currently supported:', eventName);
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
