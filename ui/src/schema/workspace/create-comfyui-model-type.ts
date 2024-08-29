import z from 'zod';

export const createComfyuiModelTypeSchema = z.object({
  name: z.string(),
  path: z.string(),
  displayName: z.string().optional(),
  description: z.string().optional(),
});

export type ICreateComfyuiModelType = z.infer<typeof createComfyuiModelTypeSchema>;
