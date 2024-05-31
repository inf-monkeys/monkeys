import type { ParsedEvent, ReconnectInterval } from 'eventsource-parser';
import { createParser } from 'eventsource-parser';

import '@/utils/polyfills/readable-stream-async-iterator-polyfill.ts';
import { JSONValue } from '@/package/vines-flow/core/tools/typings.ts';
import { stringify } from '@/utils/fast-stable-stringify.ts';

export const parseOpenAIStream = (rawResponse: Response, multipleChat = true) => {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  if (!rawResponse.ok) {
    return new Response(rawResponse.body, {
      status: rawResponse.status,
      statusText: rawResponse.statusText,
    });
  }

  const stream = new ReadableStream({
    async start(controller) {
      const streamParser = (event: ParsedEvent | ReconnectInterval) => {
        if (event.type === 'event') {
          const data = event.data;
          if (data === '[DONE]') {
            controller.close();
            return;
          }
          try {
            const json = JSON.parse(data);

            const text = (multipleChat ? json?.choices?.[0]?.delta?.content : json?.choices?.[0]?.text) || '';

            const streamObject = json?.object ?? 'chat.completion.chunk';
            let msgType: 'text' | 'tool' = 'text';
            let msgContent: JSONValue = '';
            switch (streamObject) {
              case 'chat.completion.chunk':
                msgType = 'text';
                msgContent = text;
                break;
              case 'chat.completion.log':
                msgType = 'tool';
                msgContent = json?.data ?? {};
                break;
            }

            controller.enqueue(encoder.encode(stringify({ type: msgType, content: msgContent })));
          } catch (e) {
            controller.error(e);
          }
        }
      };

      const parser = createParser(streamParser);
      for await (const chunk of rawResponse.body as any) parser.feed(decoder.decode(chunk));
    },
  });

  return new Response(stream);
};
