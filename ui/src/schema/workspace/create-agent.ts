import z from 'zod';

export const createAgentSchema = z.object({
  displayName: z.string(),
  description: z.string().max(200, '描述不能超过200个字符').optional(),
  iconUrl: z.string().optional(),
  model: z.string(),
  customModelName: z.string().optional(),
});

export type ICreateAgentInfo = z.infer<typeof createAgentSchema>;
