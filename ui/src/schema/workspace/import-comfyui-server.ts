import z from 'zod';

export const importComfyuiServerSchema = z.object({
  address: z.string().url('必须为合法的链接'),
  description: z.string().min(1, '描述不能为空'),
});

export type IImportComfyuiServer = z.infer<typeof importComfyuiServerSchema>;
