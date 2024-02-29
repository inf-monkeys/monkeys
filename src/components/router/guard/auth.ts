import { ParsedLocation, redirect } from '@tanstack/react-router';

import { has, set } from 'lodash';
import { decodeToken as jwtDecodeToken, isExpired as jwtIsExpired } from 'react-jwt';
import { toast } from 'sonner';

import { readLocalStorageValue, setLocalStorage } from '@/utils';

export interface IUser {
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

export interface IUserToken {
  data: IUser;
  token: string;
}

export type IUserTokens = Record<string, IUserToken>;

const TOKEN_KEY = 'vines-tokens';

export const isAuthed = () => {
  const token = readLocalStorageValue('vines-token', '', false);

  return token && jwtDecodeToken(token) && !jwtIsExpired(token);
};

export const authGuard = ({ location }: { location: ParsedLocation }) => {
  if (!isAuthed()) {
    throw redirect({
      to: '/login',
      search: {
        redirect_url: location.pathname,
      },
    });
  }
};

export const saveAuthToken = (token: string): number => {
  const decodeToken = jwtDecodeToken(token) as { id: string } | undefined;
  if (!decodeToken) {
    toast.error('登录信息解析失败！');
    return 0;
  }

  const localData = readLocalStorageValue<IUserTokens>(TOKEN_KEY, {});

  const userId = decodeToken.id;
  set(localData, `[${userId}].data`, decodeToken);
  set(localData, `[${userId}].token`, token);
  setLocalStorage('vines-token', token);
  setLocalStorage('vines-account', decodeToken);
  setLocalStorage(TOKEN_KEY, localData);

  const userCount = Object.keys(localData).length;
  if (userCount > 1) {
    window.dispatchEvent(
      new CustomEvent('mantine-local-storage', {
        detail: {
          key: TOKEN_KEY,
          value: localData,
        },
      }),
    );
  }

  return userCount;
};

export const logout = (id: string) =>
  new Promise((resolve) => {
    const users = readLocalStorageValue<IUserTokens>(TOKEN_KEY, {});
    if (has(users, id)) {
      const {
        data: { name },
      } = users[id];
      toast(`确定要登出「${name}」吗`, {
        action: {
          label: '登出',
          onClick: () => {
            delete users[id];
            if (Object.keys(users).length === 0) {
              localStorage.removeItem('vines-token');
              localStorage.removeItem('vines-account');
              localStorage.removeItem('vines-team-id');
              localStorage.removeItem('vines-teams');
            }
            setLocalStorage(TOKEN_KEY, users);
            resolve(true);
            toast.success(`已登出成功登出「${name}」`);
          },
        },
        onDismiss: () => resolve(false),
      });
    } else {
      toast.error('用户已登出');
      resolve(false);
    }
  });

export const swapAccount = (id: string) => {
  const users = readLocalStorageValue<IUserTokens>(TOKEN_KEY, {});
  const targetUser = users[id];
  if (targetUser) {
    setLocalStorage('vines-token', targetUser.token);
    setLocalStorage('vines-account', targetUser.data);
    toast.success(`已切换到「${targetUser.data.name}」`);
  } else {
    toast.error('切换失败，用户不存在');
  }
};
