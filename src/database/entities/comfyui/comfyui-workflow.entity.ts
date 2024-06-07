import { ComfyuiPrompt, ComfyuiWorkflow } from '@/common/typings/comfyui';
import { BlockDefProperties } from '@inf-monkeys/vines';
import { Column, Entity } from 'typeorm';
import { BaseAssetEntity } from '../assets/base-asset';

export enum ComfyuiWorkflowSourceType {
  Image = 'image',
  Json = 'json',
  Comfyfile = 'comfyfile',
}

export interface ComfyUIWorkflowAddtionalModel {
  name: string;
  url: string;
  dest: string;
}

export interface ComfyUIWorkflowAddtionalNode {
  name: string;
  url: string;
}

@Entity({ name: 'comfyui_workflows' })
export class ComfyuiWorkflowEntity extends BaseAssetEntity {
  @Column({
    name: 'workflow_type',
    type: 'varchar',
    length: 255,
  })
  workflowType: ComfyuiWorkflowSourceType;

  @Column({
    name: 'originla_data',
    type: 'simple-json',
    comment: 'Original Data',
  })
  originalData: { [x: string]: any };

  @Column({
    name: 'workflow',
    type: 'simple-json',
    nullable: true,
  })
  workflow?: ComfyuiWorkflow;

  @Column({
    name: 'prompt',
    type: 'simple-json',
    nullable: true,
  })
  prompt?: ComfyuiPrompt;

  @Column({
    name: 'tool_input',
    type: 'simple-json',
  })
  toolInput: BlockDefProperties[];

  @Column({
    name: 'tool_output',
    type: 'simple-json',
  })
  toolOutput: BlockDefProperties[];

  @Column({
    name: 'additional_model_list',
    type: 'simple-json',
    nullable: true,
  })
  additionalModelList?: ComfyUIWorkflowAddtionalModel[];

  @Column({
    name: 'additional_node_list',
    type: 'simple-json',
    nullable: true,
  })
  additionalNodeList?: ComfyUIWorkflowAddtionalNode[];
}
