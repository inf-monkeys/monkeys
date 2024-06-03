import z from 'zod';

export const databaseInfoSchema = z.object({
  createType: z.string().min(1, '创建类型不能为空'),

  // BuiltIn
  displayName: z.string().optional(),
  description: z.string().optional(),
  iconUrl: z.string().optional(),

  // External
  externalDatabaseType: z.string().optional(),
  externalDatabaseConnectionOptions: z
    .object({
      host: z.string().optional(),
      port: z.string().optional(),
      username: z.string().optional(),
      password: z.string().optional(),
      database: z.string().optional(),
      schema: z.string().optional(),
    })
    .optional(),
});

export type IDatabaseInfo = z.infer<typeof databaseInfoSchema>;
