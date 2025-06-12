import z from 'zod';

export const createWorkflowSchema = z.object({
  displayName: z.union([z.string(), z.record(z.string(), z.string())]),
  description: z.union([z.string(), z.record(z.string(), z.string())]),
  iconUrl: z.string(),
});

export type ICreateWorkflowInfo = z.infer<typeof createWorkflowSchema>;
