/* eslint-disable react-refresh/only-export-components */
import React, { useEffect, useRef } from 'react';

import { useNavigate } from '@tanstack/react-router';

import { pick, setWith } from 'lodash';
import { toast } from 'sonner';

import { handleOidcLogout } from '@/apis/authz/oidc';
import { useTeams } from '@/apis/authz/team';
import { useUser } from '@/apis/authz/user';
import { IVinesUser } from '@/apis/authz/user/typings.ts';
import { AuthMethod } from '@/apis/common/typings';
import { logout, swapAccount } from '@/components/router/guard/auth.ts';
import { Route } from '@/pages/login';
import { useLocalStorage } from '@/utils';
import VinesEvent from '@/utils/events.ts';
import { maskEmail, maskPhone } from '@/utils/maskdata.ts';

export const UserGuard: React.FC = () => {
  const navigate = useNavigate({ from: Route.fullPath });

  const { data: user, mutate, error } = useUser();

  const [localUser, setUser] = useLocalStorage<Partial<IVinesUser>>('vines-account', {});
  const [users, setUsers] = useLocalStorage<Partial<IVinesUser>[]>('vines-tokens', []);

  const { mutate: teamsMutate } = useTeams();

  const userIds = Object.keys(users);
  const handleLogout = async (id?: string) => {
    if (await logout(id ?? localUser.id ?? '')) {
      const filtered = userIds.filter((it) => it !== id);
      if (!filtered.length) {
        if (user?.lastAuthMethod === AuthMethod.oidc) {
          handleOidcLogout();
        } else {
          await navigate({ to: '/login' });
        }
      } else {
        swapAccount(filtered[0]);
        setTimeout(() => teamsMutate());
      }
    }
  };

  const isNeedToUpdate = useRef(true);
  useEffect(() => {
    if (!user) return;
    const currentUser = user?.id ?? '';
    if (localUser.id !== currentUser) {
      void mutate();
      isNeedToUpdate.current = true;
    } else if (isNeedToUpdate.current) {
      const newUserData = pick(user, ['id', 'name', 'nickname', 'photo', 'email', 'phone', 'loginsCount']);
      const userId = newUserData.id ?? newUserData.id;
      const finalUser = { ...newUserData, id: userId };
      setUser(finalUser);
      const newUsers = setWith(users, `${userId}.data`, finalUser);
      setUsers(newUsers);
      isNeedToUpdate.current = false;
    }
  }, [localUser, user]);

  useEffect(() => {
    VinesEvent.on('vines-logout', handleLogout);
    return () => {
      VinesEvent.off('vines-logout', handleLogout);
    };
  }, [userIds, localUser.id]);

  useEffect(() => {
    if (error instanceof Error) {
      const errorMessage = error?.message;

      if (errorMessage !== '需要登录') {
        if (errorMessage === '请先登录') {
          toast.error('登录已过期，请重新登录');
        } else {
          toast.error('接口数据异常！请重新登录');
        }

        localStorage.removeItem('vines-token');
        localStorage.removeItem('vines-team-id');
        void navigate({ to: '/login' });
      }
    }
  }, [error]);

  return null;
};

export const useVinesUser = () => {
  const [user, setUser] = useLocalStorage<Partial<IVinesUser>>('vines-account', {});

  const userEmail = user.email ?? '';
  const userPhone = user.phone ?? '';
  const userEmailMask = maskEmail(userEmail);
  const userPhoneMask = maskPhone(userPhone);

  return {
    user,
    setUser,

    userPhoto: user.photo ?? 'https://static.aside.fun/upload/frame/0XMWE1.jpg',
    userName: user.name ?? 'AI',
    userEmail,
    userEmailMask,
    userPhone,
    userPhoneMask,
    userAccount: userPhone || userEmail,
    userAccountMask: userPhone ? userPhoneMask : userEmailMask,
    userId: user.id ?? 'anonymous',
  };
};