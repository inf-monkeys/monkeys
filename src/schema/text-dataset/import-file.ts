import z from 'zod';

export const importFileSchema = z.object({
  fileURL: z.string().min(1, '请上传文件'),

  split: z.object({
    splitType: z.enum(['custom-segment', 'auto-segment']),
    params: z.object({
      preProcessRules: z.array(z.string()).optional(),
      segmentParams: z
        .object({
          segmentChunkOverlap: z.number().min(5, '分段重叠长度至少为 5').max(1000, '分段重叠长度最多为 1000'),
          segmentMaxLength: z.number().max(1000, '分段最大长度最多为 1000'),
          segmentSymbol: z.string(),
        })
        .optional(),
    }),
  }),
});

export type IImportFile = z.infer<typeof importFileSchema>;

export const PRE_PROCESS_RULES: { value: string; label: string }[] = [
  { value: 'replace-space-n-tab', label: '替换掉连续的空格、换行符和制表符' },
  { value: 'delete-url-and-email', label: '删除所有 URL 地址和电子邮件地址' },
];
