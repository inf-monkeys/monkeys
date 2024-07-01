import { WorkflowTriggerType } from '@inf-monkeys/monkeys';
import z from 'zod';

export const vinesSearchWorkflowExecutionsSchema = z.object({
  workflowId: z.string(),
  freeText: z.string().optional(),
  creatorUserId: z.string().optional(),
  startTimeFrom: z.number().optional(),
  endTimeTo: z.number().optional(),
  orderBy: z
    .object({
      filed: z.enum(['startTime', 'endTime', 'workflowId', 'workflowType', 'status']).optional(),
      order: z.enum(['DESC', 'ASC']).optional(),
    })
    .optional(),
  pagination: z
    .object({
      page: z.number(),
      limit: z.number(),
    })
    .optional(),
  status: z.array(z.enum(['RUNNING', 'COMPLETED', 'FAILED', 'TIMED_OUT', 'TERMINATED', 'PAUSED'])).optional(),
  triggerTypes: z
    .array(z.enum([WorkflowTriggerType.MANUALLY, WorkflowTriggerType.SCHEDULER, WorkflowTriggerType.WEBHOOK]))
    .optional(),
  workflowInstanceId: z.string().optional(),
  versions: z.array(z.number()).optional(),
});
export type IVinesSearchWorkflowExecutionsParams = z.infer<typeof vinesSearchWorkflowExecutionsSchema>;
