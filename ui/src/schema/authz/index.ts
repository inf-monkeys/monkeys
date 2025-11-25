import z from 'zod';

import {
  EMAIL_REGEX,
  PASSWORD_REGEX,
  PHONE_REGEX,
  VERIFY_CODE_REGEX,
} from '@/consts/authz';

export const loginViaMailSchema = z.object({
  email: z.string().refine((s) => EMAIL_REGEX.test(s), { message: 'auth.login.validation.invalid-email' }),
  password: z.string().refine((s) => PASSWORD_REGEX.test(s), { message: 'auth.login.validation.invalid-password' }),
});
export type ILoginViaMail = z.infer<typeof loginViaMailSchema>;

export const loginViaSmsSchema = z.object({
  phoneNumber: z.string().refine((s) => PHONE_REGEX.test(s), { message: 'auth.login.validation.invalid-phone' }),
  verifyCode: z.string().refine((s) => VERIFY_CODE_REGEX.test(s), { message: 'auth.login.validation.invalid-verify-code' }),
});
export type ILoginViaSms = z.infer<typeof loginViaSmsSchema>;
