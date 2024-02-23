import { ParsedLocation, redirect } from '@tanstack/react-router';

import { readLocalStorageValue } from '@mantine/hooks';
import { set } from 'lodash';
import { decodeToken as jwtDecodeToken, isExpired as jwtIsExpired } from 'react-jwt';
import { toast } from 'sonner';
import { parse, stringify } from 'superjson';

const TOKEN_KEY = 'vines-tokens';

export const isAuthed = () => {
  const token = readLocalStorageValue({
    key: 'vines-token',
    defaultValue: '',
  });

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

  const localData = readLocalStorageValue({
    key: TOKEN_KEY,
    defaultValue: {},
    deserialize: (str) => (str === undefined ? {} : parse(str)),
  });

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
          value: stringifyData,
        },
      }),
    );
  }

  return userCount;
};
