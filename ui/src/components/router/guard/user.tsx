/* eslint-disable react-refresh/only-export-components */
import React, { useEffect, useRef } from 'react';

import { pick } from 'lodash';
import { toast } from 'sonner';

import { handleOidcLogout } from '@/apis/authz/oidc';
import { useUser } from '@/apis/authz/user';
import { IVinesUser } from '@/apis/authz/user/typings.ts';
import { AuthMethod } from '@/apis/common/typings';
import { logout } from '@/components/router/guard/auth.ts';
import { useLocalStorage } from '@/hooks/use-local-storage';
import VinesEvent from '@/utils/events.ts';
import { maskEmail, maskPhone } from '@/utils/maskdata.ts';

export const UserGuard: React.FC = () => {
  const { data: user, mutate, error } = useUser();

  const [localUser, setUser] = useLocalStorage<Partial<IVinesUser>>('vines-account', {});

  const handleLogout = () => {
    if (logout()?.lastAuthMethod === AuthMethod.oidc) {
      handleOidcLogout();
    } else {
      VinesEvent.emit('vines-nav', '/login');
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
      isNeedToUpdate.current = false;
    }
  }, [localUser, user]);

  useEffect(() => {
    VinesEvent.on('vines-logout', handleLogout);
    return () => {
      VinesEvent.off('vines-logout', handleLogout);
    };
  }, [localUser.id]);

  useEffect(() => {
    if (error instanceof Error && window['vinesRoute']?.[0] !== 'workspace') {
      const errorMessage = error?.message;

      if (errorMessage !== 'Login Required') {
        toast.warning(errorMessage ? errorMessage : 'Network Error');
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
