import { ParsedLocation } from '@tanstack/react-router';

import { IVinesTeam } from '@/apis/authz/team/typings.ts';
import { authGuard } from '@/components/router/guard/auth.ts';
import { readLocalStorageValue } from '@/hooks/use-local-storage';
import { Route } from '@/pages/$teamId/index.lazy.tsx';
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

  localStorage.setItem('vines-team-id', teamId);
  window['vinesTeamId'] = teamId;

  const teams = readLocalStorageValue<IVinesTeam[]>('vines-teams', []);
  if (!teams || !teams.length) {
    setTimeout(() => VinesEvent.emit('vines-nav', '/'), 500);
    return;
  }

  if (!teams.find((it) => it.id === teamId)) {
    VinesEvent.emit('vines-nav', '/$teamId', {
      teamId: teams[0].id,
    });
  }

  return authGuard({ location });
};
