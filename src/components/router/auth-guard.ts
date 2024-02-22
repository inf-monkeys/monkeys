import { ParsedLocation, redirect } from '@tanstack/react-router';

import { readLocalStorageValue } from '@mantine/hooks';
import { get, set } from 'lodash';
import { decodeToken as jwtDecodeToken, isExpired as jwtIsExpired } from 'react-jwt';
import { toast } from 'sonner';
import { parse, stringify } from 'superjson';

const TOKEN_KEY = 'vines-tokens';

export const isAuthed = () => {
  const tokens = readLocalStorageValue({
    key: TOKEN_KEY,
    defaultValue: {},
    deserialize: (str) => (str === undefined ? {} : parse(str)),
  });

  const token = get(tokens, `token`, '') as string;

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

export const saveAuthToken = (token: string) => {
  const decodeToken = jwtDecodeToken(token) as { id: string } | undefined;
  if (!decodeToken) {
    toast.error('登录信息解析失败！');
    return;
  }

  const localData = readLocalStorageValue({
    key: TOKEN_KEY,
    defaultValue: {},
    deserialize: (str) => (str === undefined ? {} : parse(str)),
  });

  const userId = decodeToken.id;
  set(localData, 'current', userId);
  set(localData, 'token', token);
  set(localData, `[${userId}].data`, decodeToken);
  set(localData, `[${userId}].token`, token);

  const stringifyData = stringify(localData);
  localStorage.setItem(TOKEN_KEY, stringifyData);
  window.dispatchEvent(new CustomEvent('mantine-local-storage', { detail: { key: TOKEN_KEY, value: stringifyData } }));
};
