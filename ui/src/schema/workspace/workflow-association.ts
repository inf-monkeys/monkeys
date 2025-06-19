import z from 'zod';

const baseWorkflowAssociationSchema = z.object({
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
});

const toWorkflowWorkflowAssociationMapperSchema = z.array(
  z.object({
    origin: z.string(),
    target: z.string(),
    default: z.string().optional(),
  }),
);

export const workflowAssociationSchema = z.discriminatedUnion('type', [
  baseWorkflowAssociationSchema.extend({
    type: z.literal('to-workflow'),
    targetWorkflowId: z.string(),
    mapper: toWorkflowWorkflowAssociationMapperSchema,
  }),
  baseWorkflowAssociationSchema.extend({
    type: z.literal('new-design'),
  }),
]);

export type IWorkflowAssociationForEditor = z.infer<typeof workflowAssociationSchema>;
