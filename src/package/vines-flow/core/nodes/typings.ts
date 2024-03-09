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
