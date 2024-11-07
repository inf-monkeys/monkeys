export type RunComfyuiWorkflowExtraOptions = {
  removePrompt: boolean;
  addMonkeyInput: boolean;
  monkeyInfo?: Record<string, any>;
};

export type RunComfyuiWorkflowDto = {
  server: string;
  workflow: string;
  [x: string]: any;
} & RunComfyuiWorkflowExtraOptions;
