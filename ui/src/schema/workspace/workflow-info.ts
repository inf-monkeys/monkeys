import z from 'zod';

export const workflowInfoSchema = z.object({
  displayName: z.string().min(1, '工作流名称不能为空'),
  description: z.string().max(200, '工作流描述不能超过200个字符'),
  iconUrl: z.string().optional(),
  thumbnail: z.string().optional(),
});

export type IWorkflowInfo = z.infer<typeof workflowInfoSchema>;
