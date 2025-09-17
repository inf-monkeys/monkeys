import z from 'zod';

export const designAssociationSchema = z.object({
  preferAppId: z.string().optional(),
  displayName: z.union([
    z.string().min(1, { error: 'Display name cannot be empty' }),
    z.record(z.string(), z.string()).refine((val) => Object.values(val).some((v) => v && v.trim().length > 0), {
      error: 'At least one language must have a display name',
    }),
  ]),
  description: z
    .union([
      z.string(),
      z.record(z.string(), z.string()).refine((val) => Object.values(val).some((v) => v && v.trim().length > 0), {
        error: 'At least one language must have a description',
      }),
    ])
    .optional(),
  iconUrl: z.string().optional(),
  sortIndex: z
    .number()
    .nullable()
    .optional()
    .transform((val) => val ?? undefined),
  enabled: z.boolean(),
  targetWorkflowId: z.string(),
  targetInputId: z.string(),
});

export type IDesignAssociationForEditor = z.infer<typeof designAssociationSchema>;
