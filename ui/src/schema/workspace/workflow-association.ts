import z from 'zod';

export const workflowAssociationSchema = z.object({
  displayName: z.union([
    z.string().min(1, 'Display name cannot be empty'),
    z
      .record(z.string())
      .refine(
        (val) => Object.values(val).some((v) => v && v.trim().length > 0),
        'At least one language must have a display name',
      ),
  ]),
  description: z
    .union([
      z.string(),
      z
        .record(z.string())
        .refine(
          (val) => Object.values(val).some((v) => v && v.trim().length > 0),
          'At least one language must have a display name',
        ),
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
  mapper: z.array(
    z.object({
      origin: z.string(),
      target: z.string(),
      default: z.string().optional(),
    }),
  ),
});

export type IWorkflowAssociationForEditor = z.infer<typeof workflowAssociationSchema>;
