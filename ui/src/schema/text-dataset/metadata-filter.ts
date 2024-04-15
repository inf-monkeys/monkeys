import z from 'zod';

export const metadataFilterSchema = z.object({
  metadata: z.array(z.object({ key: z.string(), value: z.string().min(1, '请输入匹配值') })),
});

export type IMetadataFilter = z.infer<typeof metadataFilterSchema>;
