import z from 'zod';

export const createTableSchema = z.object({
  tableName: z.string().min(1, '请输入表名').max(20, '表名长度不能超过 20'),
  sql: z.string().min(1, '请输入 SQL 语句'),
});

export type ICreateTable = z.infer<typeof createTableSchema>;
