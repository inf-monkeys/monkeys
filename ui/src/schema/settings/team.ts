import z from 'zod';

import { MSG_INVALID_NAME } from '@/consts/setttings/team.ts';

export const createTeamSchema = z.object({
  name: z.string().min(1, MSG_INVALID_NAME),
  description: z.string(),
  logoUrl: z.string(),
});
export type ICreateTeam = z.infer<typeof createTeamSchema>;
