import z from 'zod';

export const datasetInfoSchema = z.object({
  displayName: z.string().min(1, '工作流名称不能为空'),
  embeddingModel: z.string().min(1, '索引模型不能为空'),
  description: z.string().max(100, '数据集简介不能超过100个字符').optional(),
  iconUrl: z.string(),
});

export type IDatasetInfo = z.infer<typeof datasetInfoSchema>;
