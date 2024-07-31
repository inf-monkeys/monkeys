import z from 'zod';

export const agentInfoSchema = z.object({
  displayName: z.string().min(1, 'agent.info.display-name-is-non-empty'),
  description: z.string().max(200, 'agent.info.description-is-too-long'),
  iconUrl: z.string(),
});

export type IAgentInfo = z.infer<typeof agentInfoSchema>;
