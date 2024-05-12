import type { ParsedEvent, ReconnectInterval } from 'eventsource-parser';
import { createParser } from 'eventsource-parser';

import '@/utils/polyfills/readable-stream-async-iterator-polyfill.ts';

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
            const text = multipleChat ? json.choices[0].delta?.content : json.choices[0]?.text || '';
            const queue = encoder.encode(text);
            controller.enqueue(queue);
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
