import { MonkeyTaskDefTypes, MonkeyWorkflow } from '@inf-monkeys/vines';
import type { ForkJoinTaskDef, JoinTaskDef, SimpleTaskDef } from '@io-orkes/conductor-javascript';

import { VinesForkJoinTaskDef } from '@/package/vines-flow/core/nodes/node/fork-join.ts';
import { VinesJoinTaskDef } from '@/package/vines-flow/core/nodes/node/join.ts';
import { IVinesFlowRenderOptions } from '@/package/vines-flow/core/typings.ts';

export interface NodeCustomData {
  icon?: string | null;
  title?: string | null;
  description?: string | null;
}

export type VinesTask = (
  | Exclude<MonkeyTaskDefTypes, JoinTaskDef | ForkJoinTaskDef>
  | VinesForkJoinTaskDef
  | VinesJoinTaskDef
) & { __alias?: NodeCustomData };

export interface IVinesWorkflowUpdate {
  workflow?: MonkeyWorkflow;
  workflowId?: string;
  version?: number;
  tasks?: MonkeyTaskDefTypes[];
  renderDirection?: IVinesFlowRenderOptions['direction'];
  renderType?: IVinesFlowRenderOptions['type'];
}

export interface IVinesNodeSize {
  width: number;
  height: number;
}

export interface IVinesNodePosition {
  x: number;
  y: number;
}

export interface IVinesNodeEntryPoint {
  in: IVinesNodePosition;
  out: IVinesNodePosition;
}

export interface IVinesNodeBoundary {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export interface IVinesNodeController {
  disabled?: boolean;
  needConfirmation?: string;
  position: IVinesNodePosition;
  icon: '+' | '-';
  onClick: () => void;
}

export interface IVinesNodeCustomData {
  icon?: string | null;
  title?: string | null;
  description?: string | null;
}

export type VinesEdgeSchemaType = 'M' | 'L' | 'Q' | 'C';

export interface IVinesEdge {
  type: VinesEdgeSchemaType;
  axis: number[][];
}

export type VinesEdgePath = IVinesEdge[];

export type IVinesMoveAfterTargetType = 'target' | 'source';

export interface IVinesCollectDoWhileOutputTaskDef extends SimpleTaskDef {
  inputParameters: {
    doWhileTaskReferenceName: string | null;
    jsonPathExpression: string | null;
  };
}
