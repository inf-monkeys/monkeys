import { AuthMethod } from '@/apis/common/typings';

export interface IVinesUser {
  id: string;
  name: string;
  phone?: string;
  photo: string;
  email?: string;
  isDeleted: boolean;
  loginsCount: number;
  lastLoginAt: number;
  createdTimestamp: number;
  updatedTimestamp: number;
  lastAuthMethod?: AuthMethod;
}

export interface IUpdateUserInfo {
  name?: string;
  photo?: string;

  phoneNumber?: string;
  verifyCode?: number;
  oldPhoneNumber?: string;
  oldVerifyCode?: number;
}
