import z from 'zod';

export const workflowApiConfigInfoSchema = z.object({
  rateLimiter: z.object({
    enabled: z.any(),
    windowMs: z.number().min(1000, '时间窗口最小为 1000 毫秒'),
    max: z.number().min(1, '单位时间窗口内运行最大并发最小为 1').max(1000, '单位时间窗口内运行最大并发最小为 1000'),
  }),
  exposeOpenaiCompatibleInterface: z.any(),
});

export type IWorkflowApiConfigInfo = z.infer<typeof workflowApiConfigInfoSchema>;
