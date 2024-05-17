import z from 'zod';

export const importComfyUIWorkflowSchema = z.object({
  displayName: z.string().min(1, '工作流名称不能为空'),
  workflowType: z.string().min(1, '工作流类型不能为空'),
  imageUrl: z.string().url('必须为合法的链接').optional(),
  workflowApiJson: z.any().optional(),
});

export type IImportComfyUIWorkflow = z.infer<typeof importComfyUIWorkflowSchema>;
