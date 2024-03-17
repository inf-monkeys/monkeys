import z from 'zod';

export const workflowTriggerScheduleSchema = z.object({
  cron: z.string().min(1, '表达式不能为空'),
});

export type IWorkflowTriggerSchedule = z.infer<typeof workflowTriggerScheduleSchema>;
