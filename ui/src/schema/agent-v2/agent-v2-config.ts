import z from 'zod';

export const agentV2ConfigSchema = z.object({
  // Basic information (for backwards compatibility with existing UI)
  displayName: z.string().optional(),
  description: z.string().max(200, 'agent.info.description-is-too-long').optional(),
  iconUrl: z.string().optional(),

  // Core Agent V2 configuration
  model: z.string().min(1, 'agent.config.model-required'),
  temperature: z
    .union([z.string(), z.number()])
    .optional()
    .transform((val) => {
      if (typeof val === 'string') return parseFloat(val);
      return val;
    }),
  maxTokens: z
    .union([z.string(), z.number()])
    .optional()
    .transform((val) => {
      if (typeof val === 'string') return parseInt(val);
      return val;
    }),
  timeout: z
    .union([z.string(), z.number()])
    .optional()
    .transform((val) => {
      if (typeof val === 'string') return parseInt(val);
      return val;
    }),

  // Reasoning effort configuration
  reasoningEffortEnabled: z.boolean().optional().default(false),
  reasoningEffortLevel: z.enum(['low', 'medium', 'high']).optional().default('medium'),

  // Tools configuration (will be handled separately)
  enabledTools: z.array(z.string()).optional(),
});

export type IAgentV2Config = z.infer<typeof agentV2ConfigSchema>;

// Transform form data to API format
export const transformToApiConfig = (formData: IAgentV2Config) => {
  return {
    model: formData.model,
    temperature: formData.temperature,
    maxTokens: formData.maxTokens,
    timeout: formData.timeout,
    reasoningEffort: {
      enabled: formData.reasoningEffortEnabled || false,
      level: formData.reasoningEffortLevel || 'medium',
    },
  };
};

// Transform API data to form format
export const transformFromApiConfig = (apiData: any) => {
  return {
    model: apiData.model,
    temperature: apiData.temperature,
    maxTokens: apiData.maxTokens,
    timeout: apiData.timeout,
    reasoningEffortEnabled: apiData.reasoningEffort?.enabled || false,
    reasoningEffortLevel: apiData.reasoningEffort?.level || 'medium',
  };
};
