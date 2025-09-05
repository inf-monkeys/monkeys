import z from 'zod';

export const createAgentSchema = z.object({
  displayName: z.union([z.string(), z.record(z.string(), z.string())]),
  description: z.union([z.string(), z.record(z.string(), z.string())]).optional(),
  iconUrl: z.string().optional(),
  model: z.string(),
  customModelName: z.string().optional(),
  // Agent V2 specific configuration
  temperature: z.number().min(0).max(2).optional().default(0.7),
  maxTokens: z.number().min(1).max(100000).optional().default(4096),
  timeout: z.number().min(1000).max(300000).optional().default(30000),
  reasoningEffort: z
    .object({
      enabled: z.boolean().optional().default(false),
      level: z.enum(['low', 'medium', 'high']).optional().default('medium'),
    })
    .optional(),
});

export type ICreateAgentInfo = z.infer<typeof createAgentSchema>;
