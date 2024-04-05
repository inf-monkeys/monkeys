import z from 'zod';

export const impotrToolSchema = z.object({
  manifestUrl: z.string().min(1, 'Manifest 地址不能未空').url('必须为合法的链接'),
});

export type IImportTool = z.infer<typeof impotrToolSchema>;
