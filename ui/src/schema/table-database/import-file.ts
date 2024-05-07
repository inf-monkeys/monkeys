import z from 'zod';

export const importFileSchema = z.object({
  tableName: z.string().min(1, '请输入表名').max(20, '表名长度不能超过 20'),
  url: z.string().min(1, '请上传文件'),
  sep: z.string().min(1, '请选择分隔符').default(','),
});

export type IImportFile = z.infer<typeof importFileSchema>;
