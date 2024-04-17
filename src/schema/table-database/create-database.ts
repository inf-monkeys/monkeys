import z from 'zod';

export const databaseInfoSchema = z.object({
  displayName: z.string().min(1, '表格名称不能为空'),
  description: z.string().max(100, '表格简介不能超过100个字符'),
  iconUrl: z.string(),
});

export type IDatabaseInfo = z.infer<typeof databaseInfoSchema>;
