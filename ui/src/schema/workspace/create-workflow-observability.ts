import z from 'zod';

import { ObservabilityPlatform } from '@/apis/workflow/observability/typings';

export const createWorkflowObservabilitySchema = z.object({
  name: z.string().optional(),
  platform: z.nativeEnum(ObservabilityPlatform),
  platformConfig: z.object({
    secretKey: z.string(),
    publicKey: z.string(),
    baseUrl: z.string().optional(),
  }),
});

export type ICreateWorkflowObservability = z.infer<typeof createWorkflowObservabilitySchema>;
