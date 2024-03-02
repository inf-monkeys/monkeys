export interface IVinesUser {
  _id: string;
  id?: string;
  name: string;
  phone?: string;
  photo: string;
  email?: string;
  isDeleted: boolean;
  loginsCount: number;
  lastLoginAt: number;
  createdTimestamp: number;
  updatedTimestamp: number;
}

export interface IUpdateUserInfo {
  name?: string;
  photo?: string;

  phoneNumber?: string;
  verifyCode?: number;
  oldPhoneNumber?: string;
  oldVerifyCode?: number;
}
