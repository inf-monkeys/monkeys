import z from 'zod';

export const createAgentSchema = z.object({
  displayName: z.union([z.string(), z.record(z.string(), z.string())]),
  description: z.union([z.string(), z.record(z.string(), z.string())]).optional(),
  iconUrl: z.string().optional(),
  model: z.string(),
  customModelName: z.string().optional(),
});

export type ICreateAgentInfo = z.infer<typeof createAgentSchema>;
