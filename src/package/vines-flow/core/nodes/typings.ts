import { MonkeyTaskDefTypes, MonkeyWorkflow } from '@inf-monkeys/vines';
import type { ForkJoinTaskDef, JoinTaskDef } from '@io-orkes/conductor-javascript';

import { VinesForkJoinTaskDef } from '@/package/vines-flow/core/nodes/node/fork-join.ts';
import { VinesJoinTaskDef } from '@/package/vines-flow/core/nodes/node/join.ts';

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
  tasks?: MonkeyTaskDefTypes[];
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
