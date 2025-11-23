import z from 'zod';

export const createModelTrainingSchema = z.object({
  displayName: z.string(),
  description: z.string().max(200, '描述不能超过200个字符').optional(),
  versionType: z.number().int().min(1).optional(),
});

export type ICreateModelTraining = z.infer<typeof createModelTrainingSchema>;
