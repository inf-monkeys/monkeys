import z from 'zod';

export const designProjectInfoSchema = z.object({
  displayName: z.string().min(1, 'design.project.info.display-name-is-non-empty'),
  description: z.string().max(200, 'design.project.info.description-is-too-long'),
  iconUrl: z.string(),
});

export type IDesignProjectInfo = z.infer<typeof designProjectInfoSchema>;
