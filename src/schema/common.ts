import z from 'zod';

export const pageSearchSchema = z.object({
  redirect_url: z.string().optional(),
});

export const loginCallbackPageSearchSchema = z.object({
  access_token: z.string().optional(),
});
