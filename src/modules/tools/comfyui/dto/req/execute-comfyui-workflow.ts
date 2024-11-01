export type RunComfyuiWorkflowExtraOptions = {
  removePrompt: boolean;
} & (
  | {
      addMonkeyInput: true;
      instanceId: string;
      teamId: string;
    }
  | {
      addMonkeyInput: false;
    }
);

export type RunComfyuiWorkflowDto = {
  server: string;
  workflow: string;
  [x: string]: any;
} & RunComfyuiWorkflowExtraOptions;
