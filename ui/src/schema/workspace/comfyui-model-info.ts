import z from 'zod';

export const comfyuiModelInfoSchema = z.object({
  iconUrl: z.string().optional(),
  displayName: z.string().optional(),
  description: z.string().optional(),
});

export type IComfyuiModelInfo = z.infer<typeof comfyuiModelInfoSchema>;
