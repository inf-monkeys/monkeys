import { ComfyuiPrompt, ComfyuiWorkflow } from '@/common/typings/comfyui';

export class CheckComfyUIWorkflowDependenciesDto {
  serverName: string;
  workflow: ComfyuiWorkflow;
  prompt?: ComfyuiPrompt;
}
