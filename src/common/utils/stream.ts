import { IncomingMessage } from 'http';
import { logger } from '../logger';

export const readIncomingMessage = (
  message: IncomingMessage,
  callbacks?: {
    onDataCallback?: (chunk: any) => void;
    onEndCallback?: (result: any) => void;
  },
) => {
  const { onDataCallback, onEndCallback } = callbacks || {};
  return new Promise<string>((resolve, reject) => {
    let responseData: string = '';
    message.on('data', (chunk) => {
      responseData += chunk;
      if (onDataCallback) {
        onDataCallback(chunk);
      }
    });
    message.on('end', () => {
      if (onEndCallback) {
        onEndCallback(responseData);
      }
      resolve(responseData);
    });
    message.on('error', (error) => {
      logger.error('Error receiving response data:', error);
      reject(error);
    });
  });
};
