import { EventEmitter } from 'events';

export interface Mq {
  subscribe(channel: string, callback: (channel: string, message: string) => void): void;
  publish(channel: string, message: string): Promise<void>;
}

class ChatMessageEventEmitter extends EventEmitter {}

export class EventEmitterMq implements Mq {
  emitter: ChatMessageEventEmitter;

  constructor() {
    this.emitter = new ChatMessageEventEmitter();
  }

  public async publish(channel: string, message: string) {
    this.emitter.emit(channel, message);
  }

  public subscribe(channel: string, callback: (channel: string, message: string) => void) {
    this.emitter.on(channel, (data: string) => {
      callback(channel, data);
    });
  }
}
