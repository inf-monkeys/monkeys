import z from 'zod';

export const importFileSchema = z.object({
  fileURL: z.string().min(1, '请上传文件'),
  splitterType: z.enum(['custom-segment', 'auto-segment']),
  preProcessRules: z.array(z.string()).optional(),
  splitterConfig: z
    .object({
      chunk_overlap: z.number().min(0, '分段重叠长度至少为 5').optional(),
      chunk_size: z.number().min(0, '分段最大长度最小为 0').optional(),
      separator: z.string().optional(),
    })
    .optional(),
});

export type IImportFile = z.infer<typeof importFileSchema>;

export const PRE_PROCESS_RULES: string[] = ['replace-space-n-tab', 'delete-url-and-email'];
