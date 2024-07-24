import { ParsedLocation, redirect } from '@tanstack/react-router';

import isMongoId from 'validator/es/lib/isMongoId';
import z from 'zod';

import { IVinesTeam } from '@/apis/authz/team/typings.ts';
import { authGuard } from '@/components/router/guard/auth.ts';
import { readLocalStorageValue, setLocalStorage } from '@/hooks/use-local-storage';
import { Route } from '@/pages/$teamId';

export const teamIdGuard = async ({
  location,
  params: { teamId },
}: {
  location: ParsedLocation;
  params: (typeof Route)['params'];
  skip?: boolean;
}) => {
  const teams = readLocalStorageValue<IVinesTeam[]>('vines-teams', []);
  if (!teams || !teams.length)
    throw redirect({
      to: '/',
      search: {
        redirect_url: location.pathname,
      },
    });

  if (!z.string().refine(isMongoId).safeParse(teamId).success || !teams.find((it) => it.id === teamId)) {
    throw redirect({
      to: '/$teamId',
      params: {
        teamId: teams[0].id,
      },
    });
  }

  setLocalStorage('vines-team-id', teamId);

  return authGuard({ location });
};
