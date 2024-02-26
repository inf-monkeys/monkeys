import React from 'react';

import { createFileRoute, Outlet, redirect, useRouter } from '@tanstack/react-router';

import isMongoId from 'validator/es/lib/isMongoId';
import z from 'zod';

import { ITeam } from '@/apis/authz/team/typings.ts';
import { Sidebar } from '@/components/layout/main/sidebar';
import { authGuard } from '@/components/router/guard/auth.ts';
import { readLocalStorageValue } from '@/utils';

const MainWrapper: React.FC = () => {
  const router = useRouter();

  console.log(router);
  return (
    <div className="flex w-screen bg-slate-3">
      <Sidebar />
      <div className="m-4 ml-0 flex w-full flex-1 rounded-xl bg-slate-1 p-4">
        <Outlet />
      </div>
    </div>
  );
};

export const Route = createFileRoute('/$teamId/')({
  component: MainWrapper,
  beforeLoad: async ({ location, params: { teamId } }) => {
    const teams = readLocalStorageValue<ITeam[]>('vines-teams', []);
    if (!teams.length)
      throw redirect({
        to: '/',
        search: {
          redirect_url: location.pathname,
        },
      });

    if (!z.string().refine(isMongoId).safeParse(teamId).success || !teams.find((it) => it.id === teamId)) {
      throw redirect({ to: '/' + teams[0].id });
    }

    return authGuard({ location });
  },
});
