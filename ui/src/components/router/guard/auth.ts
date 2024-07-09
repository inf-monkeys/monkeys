import { ParsedLocation, redirect } from '@tanstack/react-router';

import { pick } from 'lodash';
import { decodeToken as jwtDecodeToken, isExpired as jwtIsExpired } from 'react-jwt';
import { toast } from 'sonner';
import { isJWT } from 'validator';

import { getUser } from '@/apis/authz/user';
import { IVinesUser } from '@/apis/authz/user/typings.ts';
import i18n from '@/i18n.ts';
import { deleteLocalStorage, readLocalStorageValue, setLocalStorage } from '@/utils';

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

export const authGuard = ({ location }: { location: ParsedLocation }) => {
  if (!isAuthed()) {
    throw redirect({
      to: '/login',
      search: {
        redirect_url: (location.search as { redirect_url?: string })?.redirect_url || location.pathname,
      },
    });
  }
};

export const saveAuthToken = async (token: string): Promise<Partial<IVinesUser> | undefined> => {
  if (!isJWT(token)) {
    toast.error(t('auth.parse-token-failed'));
    return;
  }

  localStorage.removeItem('vines-team-id');
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
  deleteLocalStorage('vines-teams', true, '{"json":[]}');

  return user;
};
