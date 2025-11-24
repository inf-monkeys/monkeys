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
  const userId = user?.id;

  if (userName) {
    toast.success(i18n.t('auth.users.logout-user', { name: userName }));
  } else {
    toast.error(i18n.t('auth.users.logout-success'));
  }

  // 保存当前用户的 teamId，以便该用户再次登录时能恢复
  if (userId) {
    const currentTeamId = readLocalStorageValue('vines-team-id', '', false);
    if (currentTeamId) {
      try {
        const userTeamMap = readLocalStorageValue<Record<string, string>>('vines-user-team-map', {});
        userTeamMap[userId] = currentTeamId;
        setLocalStorage('vines-user-team-map', userTeamMap);
      } catch (error) {
        console.error('Failed to save user team mapping:', error);
      }
    }
  }

  deleteLocalStorage('vines-token', false);
  deleteLocalStorage('vines-account', false);
  deleteLocalStorage('vines-team-id', false);
  deleteLocalStorage('vines-teams');

  return user;
};
