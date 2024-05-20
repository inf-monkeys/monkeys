import { ParsedLocation, redirect } from '@tanstack/react-router';

import { has, pick, set } from 'lodash';
import { decodeToken as jwtDecodeToken, isExpired as jwtIsExpired } from 'react-jwt';
import { toast } from 'sonner';
import { isJWT } from 'validator';

import { getUser } from '@/apis/authz/user';
import { IVinesUser } from '@/apis/authz/user/typings.ts';
import { readLocalStorageValue, setLocalStorage } from '@/utils';

export interface IUserToken {
  data: IVinesUser;
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
        redirect_url: (location.search as { redirect_url?: string })?.redirect_url || location.pathname,
      },
    });
  }
};

export const saveAuthToken = async (token: string): Promise<number> => {
  if (!isJWT(token)) {
    toast.error('身份信息解析失败！');
    return 0;
  }

  setLocalStorage('vines-token', token);

  const localData = readLocalStorageValue<IUserTokens>(TOKEN_KEY, {});

  const localUserData = Object.values(localData).find((it) => it.token === token);
  if (!localUserData) {
    const user = await getUser();
    const userId = user?.id;
    if (!user || !userId) {
      toast.error('用户信息获取失败！');
      return 0;
    }
    const userData = pick(user, ['id', 'name', 'nickname', 'photo', 'email', 'phone', 'loginsCount']);

    set(localData, `[${userId}].data`, userData);
    set(localData, `[${userId}].token`, token);
    setLocalStorage('vines-account', userData);
  } else {
    setLocalStorage('vines-account', localUserData.data);
  }

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

export const logout = (id: string): Promise<number> =>
  new Promise((resolve) => {
    const users = readLocalStorageValue<IUserTokens>(TOKEN_KEY, {});
    const userLength = Object.keys(users).length;
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
            resolve(userLength);
            toast.success(`已登出成功登出「${name}」`);
          },
        },
        onDismiss: () => resolve(userLength),
      });
    } else {
      toast.error('已登出');
      resolve(userLength);
    }
  });

export const swapAccount = (id: string) => {
  const users = readLocalStorageValue<IUserTokens>(TOKEN_KEY, {});
  const targetUser = users[id];
  if (targetUser) {
    setLocalStorage('vines-token', targetUser.token);
    setLocalStorage('vines-account', targetUser.data);
    toast.success(`已切换到「${targetUser.data.name}」`);
    return true;
  } else {
    toast.error('切换失败，用户不存在');
    return false;
  }
};
