import z from 'zod';

export const createWorkflowSchema = z.object({
  displayName: z.string(),
  description: z.string().max(200, '描述不能超过200个字符'),
  iconUrl: z.string(),
});

export type ICreateWorkflowInfo = z.infer<typeof createWorkflowSchema>;
