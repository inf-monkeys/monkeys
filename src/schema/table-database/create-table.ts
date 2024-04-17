import z from 'zod';

export const createTableSchema = z.object({
  sql: z.string().min(1, '请输入 SQL 语句'),
});

export type ICreateTable = z.infer<typeof createTableSchema>;
