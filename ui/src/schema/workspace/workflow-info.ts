import z from 'zod';

export const workflowInfoSchema = z.object({
  displayName: z.union([z.string(), z.record(z.string(), z.string())]).refine(
    (value) => {
      if (typeof value === 'string') {
        return value.length > 0;
      }
      return Object.values(value).some((v) => v && v.length > 0);
    },
    { message: '工作流名称不能为空' },
  ),
  description: z.union([z.string(), z.record(z.string(), z.string())]),
  iconUrl: z.string().optional(),
  thumbnail: z.string().optional(),
});

export type IWorkflowInfo = z.infer<typeof workflowInfoSchema>;
