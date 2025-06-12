import z from 'zod';

export const agentInfoSchema = z.object({
  displayName: z.union([z.string(), z.record(z.string(), z.string())]).refine(
    (value) => {
      if (typeof value === 'string') {
        return value.length > 0;
      }
      return Object.values(value).some((v) => v && v.length > 0);
    },
    { message: 'agent.info.display-name-is-non-empty' },
  ),
  description: z.union([z.string(), z.record(z.string(), z.string())]),
  iconUrl: z.string(),
});

export type IAgentInfo = z.infer<typeof agentInfoSchema>;
