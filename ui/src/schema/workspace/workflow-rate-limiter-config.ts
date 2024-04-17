import z from 'zod';

export const workflowRateLimiterInfoSchema = z.object({
  enabled: z.any(),
  windowMs: z.number().min(1000, '时间窗口最小为 1000 毫秒'),
  max: z.number().min(1, '单位时间窗口内运行最大并发最小为 1').max(1000, '单位时间窗口内运行最大并发最小为 1000'),
});

export type IWorkflowRateLimiterInfo = z.infer<typeof workflowRateLimiterInfoSchema>;
