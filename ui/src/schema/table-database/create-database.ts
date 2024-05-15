import z from 'zod';

export const databaseInfoSchema = z.object({
  createType: z.string().min(1, '创建类型不能为空'),

  // BuiltIn
  displayName: z.string().min(1, '表格名称不能为空'),
  description: z.string().max(100, '表格简介不能超过100个字符'),
  iconUrl: z.string(),

  // External
  databaseType: z.string().min(1, '数据库类型不能为空'),
  host: z.string().min(1, '主机不能为空'),
  port: z.string().min(1, '端口不能为空'),
  username: z.string().min(1, '用户名不能为空'),
  password: z.string().min(1, '密码不能为空'),
  database: z.string().min(1, '数据库不能为空'),
});

export type IDatabaseInfo = z.infer<typeof databaseInfoSchema>;
