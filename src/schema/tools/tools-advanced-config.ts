import z from 'zod';

export const toolsAdvancedConfigSchema = z.object({
  outputAs: z.string().optional(),
  timeout: z.number().optional(),
});
export type IToolsAdvancedConfig = z.infer<typeof toolsAdvancedConfigSchema>;
