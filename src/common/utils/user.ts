import { UserEntity } from '@/database/entities/identity/user';
import { phoneNumberRegexp } from '@/modules/auth/phone/phone.controller';
import { pick } from 'lodash';

export const getPublicProfile = (user: UserEntity) => {
  const data: { [x: string]: any } = pick(user || {}, ['id', 'photo', 'name', 'username', 'email', 'phone', 'nickname']);
  if (typeof data === 'object') {
    for (const key in data) {
      const val = data[key];
      if (typeof val === 'string' && phoneNumberRegexp.test(val)) {
        data[key] = `${val.slice(0, 3)}****${val.slice(7, 11)}`;
      }
    }
  }
  return data;
};
