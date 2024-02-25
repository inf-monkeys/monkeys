import { ParsedLocation, redirect } from '@tanstack/react-router';

import { has, set } from 'lodash';
import { decodeToken as jwtDecodeToken, isExpired as jwtIsExpired } from 'react-jwt';
import { toast } from 'sonner';
import { stringify } from 'superjson';

import { readLocalStorageValue } from '@/utils';

export interface IUserToken {
  data: {
    id: string;
    name: string;
    phone: number | null;
    email: string | null;
    photo: string;
  };
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
  localStorage.setItem('vines-token', token);
  localStorage.setItem('vines-user', stringify(decodeToken));

  const stringifyData = stringify(localData);
  localStorage.setItem(TOKEN_KEY, stringifyData);

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

export const logout = (id: string) => {
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
          localStorage.setItem(TOKEN_KEY, stringify(users));
          window.dispatchEvent(
            new CustomEvent('mantine-local-storage', {
              detail: {
                key: TOKEN_KEY,
                value: users,
              },
            }),
          );
          toast.success(`已登出成功登出「${name}」`);
        },
      },
    });
  } else {
    toast.error('用户已登出');
  }
};
