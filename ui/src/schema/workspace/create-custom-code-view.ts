import z from 'zod';

export const createCustomCodeViewSchema = z.object({
  displayName: z.string().min(1, '视图名称不能为空'),
  icon: z.string(),
});

export type ICreateCustomCodeView = z.infer<typeof createCustomCodeViewSchema>;
