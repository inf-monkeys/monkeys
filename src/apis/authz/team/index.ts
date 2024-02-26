import useSWR from 'swr';

import { ITeam } from '@/apis/authz/team/typings.ts';
import { useAuthzGetFetcher } from '@/apis/fetcher.ts';

export const useTeams = (enable = true) =>
  useSWR<ITeam[]>(enable ? '/api/teams' : null, useAuthzGetFetcher, {
    refreshInterval: 600000,
    revalidateOnFocus: false,
  });
