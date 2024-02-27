import { ParsedLocation, redirect } from '@tanstack/react-router';

import isMongoId from 'validator/es/lib/isMongoId';
import z from 'zod';

import { ITeam } from '@/apis/authz/team/typings.ts';
import { authGuard } from '@/components/router/guard/auth.ts';
import { Route } from '@/pages/$teamId';
import { readLocalStorageValue } from '@/utils';

export const teamIdGuard = async ({
  location,
  params: { teamId },
}: {
  location: ParsedLocation;
  params: (typeof Route)['params'];
}) => {
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
};
