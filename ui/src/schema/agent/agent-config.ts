import z from 'zod';

export const agentConfigSchema = z.object({
  displayName: z.string().optional(),
  description: z.string().max(200, 'agent.info.description-is-too-long').optional(),
  iconUrl: z.string().optional(),

  model: z.string().optional(),
  systemPrompt: z.string().optional(),
  knowledgeBase: z.string().optional(),
  sqlKnowledgeBase: z.string().optional(),
  tools: z.array(z.string()).optional(),
  temperature: z.union([z.string(), z.number()]).optional(),
  presence_penalty: z.union([z.string(), z.number()]).optional(),
  frequency_penalty: z.union([z.string(), z.number()]).optional(),

  customModelName: z.string().optional(),
});

export type IAgentConfig = z.infer<typeof agentConfigSchema>;
