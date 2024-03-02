/* eslint-disable react-refresh/only-export-components */
import React, { useEffect } from 'react';

import { useNavigate } from '@tanstack/react-router';

import { useTeams } from '@/apis/authz/team';
import { IVinesUser } from '@/apis/authz/user/typings.ts';
import { logout, swapAccount } from '@/components/router/guard/auth.ts';
import { Route } from '@/pages/login.tsx';
import { useLocalStorage } from '@/utils';
import VinesEvent from '@/utils/events.ts';

export const UserGuard: React.FC = () => {
  const navigate = useNavigate({ from: Route.fullPath });

  const [user] = useLocalStorage<Partial<IVinesUser>>('vines-account', {});
  const [tokens] = useLocalStorage<Partial<IVinesUser>[]>('vines-tokens', []);

  const { mutate: teamsMutate } = useTeams();

  const userIds = Object.keys(tokens);
  const handleLogout = async (id?: string) => {
    if (await logout(id ?? user.id ?? '')) {
      const filtered = userIds.filter((it) => it !== id);
      if (!filtered.length) {
        await navigate({ to: '/login' });
      } else {
        swapAccount(filtered[0]);
        setTimeout(() => teamsMutate());
      }
    }
  };

  useEffect(() => {
    VinesEvent.on('vines-logout', handleLogout);
    return () => {
      VinesEvent.off('vines-logout', handleLogout);
    };
  }, [userIds, user.id]);

  return null;
};
