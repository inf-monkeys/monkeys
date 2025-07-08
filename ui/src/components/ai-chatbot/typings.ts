import { UIMessage } from 'ai';

export type MessageMetadata = {
  createdAt: string;
};

export type ChatTools = {
  getWeather: {
    input: {
      latitude: number;
      longitude: number;
    };
    output: any;
  };
};

export type CustomUIDataTypes = {
  textDelta: string;
  imageDelta: string;
  sheetDelta: string;
  codeDelta: string;
  appendMessage: string;
  id: string;
  title: string;
  clear: null;
  finish: null;
};

export type ChatMessage = UIMessage<MessageMetadata, CustomUIDataTypes, ChatTools>;
