import { ParsedLocation } from '@tanstack/react-router';

import { pick } from 'lodash';
import { decodeToken as jwtDecodeToken, isExpired as jwtIsExpired } from 'react-jwt';
import { toast } from 'sonner';
import { isJWT } from 'validator';

import { getUser } from '@/apis/authz/user';
import { IVinesUser } from '@/apis/authz/user/typings.ts';
import { deleteLocalStorage, readLocalStorageValue, setLocalStorage } from '@/hooks/use-local-storage';
import i18n from '@/i18n.ts';
import VinesEvent from '@/utils/events.ts';

const t = i18n.t;

export interface IUserToken {
  data: IVinesUser;
  token: string;
}

export type IUserTokens = Record<string, IUserToken>;

export const isAuthed = () => {
  const token = readLocalStorageValue('vines-token', '', false);

  return token && jwtDecodeToken(token) && !jwtIsExpired(token);
};

export const authGuard = (_: { location: ParsedLocation }) => {
  if (!isAuthed()) {
    VinesEvent.emit('vines-nav', '/login');
  }
};

export const saveAuthToken = async (token: string): Promise<Partial<IVinesUser> | undefined> => {
  if (!isJWT(token)) {
    toast.error(t('auth.parse-token-failed'));
    return;
  }

  localStorage.removeItem('vines-team-id');
  window['vinesTeamId'] = void 0;
  setLocalStorage('vines-token', token);

  const user = await getUser();
  const userId = user?.id;
  if (!user || !userId) {
    toast.error(t('auth.fetch-user-data-failed'));
    return;
  }
  const userData = pick(user, ['id', 'name', 'nickname', 'photo', 'email', 'phone', 'loginsCount']);

  setLocalStorage('vines-account', userData);

  window.dispatchEvent(
    new CustomEvent('mantine-local-storage', {
      detail: {
        key: 'vines-token',
        value: token,
      },
    }),
  );

  return userData;
};

export const logout = () => {
  const user = readLocalStorageValue<Partial<IVinesUser>>('vines-account', {});
  const userName = user?.name;

  if (userName) {
    toast.success(i18n.t('auth.users.logout-user', { name: userName }));
  } else {
    toast.error(i18n.t('auth.users.logout-success'));
  }

  deleteLocalStorage('vines-token', false);
  deleteLocalStorage('vines-account', false);
  deleteLocalStorage('vines-team-id', false);
  deleteLocalStorage('vines-teams');

  return user;
};
