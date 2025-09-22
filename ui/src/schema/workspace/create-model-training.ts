import z from 'zod';

export const createModelTrainingSchema = z.object({
  displayName: z.string(),
  description: z.string().max(200, '描述不能超过200个字符').optional(),
});

export type ICreateModelTraining = z.infer<typeof createModelTrainingSchema>;
