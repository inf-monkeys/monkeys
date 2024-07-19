import z from 'zod';

export const vinesSearchWorkflowExecutionStatSchema = z.object({
  startTimestamp: z.number(),
  endTimestamp: z.number(),
});
export type IVinesSearchWorkflowExecutionStatParams = z.infer<typeof vinesSearchWorkflowExecutionStatSchema>;
