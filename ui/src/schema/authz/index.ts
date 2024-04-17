import z from 'zod';

import {
  EMAIL_REGEX,
  MSG_INVALID_EMAIL,
  MSG_INVALID_PASSWORD,
  MSG_INVALID_PHONE,
  MSG_INVALID_VERIFY_CODE,
  PASSWORD_REGEX,
  PHONE_REGEX,
  VERIFY_CODE_REGEX,
} from '@/consts/authz';

export const loginViaMailSchema = z.object({
  email: z.string().refine((s) => EMAIL_REGEX.test(s), MSG_INVALID_EMAIL),
  password: z.string().refine((s) => PASSWORD_REGEX.test(s), MSG_INVALID_PASSWORD),
});
export type ILoginViaMail = z.infer<typeof loginViaMailSchema>;

export const loginViaSmsSchema = z.object({
  phoneNumber: z.string().refine((s) => PHONE_REGEX.test(s), MSG_INVALID_PHONE),
  verifyCode: z.string().refine((s) => VERIFY_CODE_REGEX.test(s), MSG_INVALID_VERIFY_CODE),
});
export type ILoginViaSms = z.infer<typeof loginViaSmsSchema>;
