import { ParsedLocation, redirect } from '@tanstack/react-router';

import { IVinesTeam } from '@/apis/authz/team/typings.ts';
import { authGuard } from '@/components/router/guard/auth.ts';
import { readLocalStorageValue, setLocalStorage } from '@/hooks/use-local-storage';
import { Route } from '@/pages/$teamId';
import VinesEvent from '@/utils/events.ts';

export const teamIdGuard = async (props: {
  location: ParsedLocation;
  params: (typeof Route)['params'];
  skip?: boolean;
}) => {
  const {
    location,
    params: { teamId },
  } = props;

  const teams = readLocalStorageValue<IVinesTeam[]>('vines-teams', []);
  if (!teams || !teams.length) {
    setTimeout(() => VinesEvent.emit('vines-nav', '/'), 500);
    return;
  }

  if (!teams.find((it) => it.id === teamId)) {
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
