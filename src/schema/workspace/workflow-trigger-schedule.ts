import z from 'zod';

export const workflowTriggerScheduleSchema = z.object({
  cron: z.string(),
});

export type IWorkflowTriggerSchedule = z.infer<typeof workflowTriggerScheduleSchema>;
