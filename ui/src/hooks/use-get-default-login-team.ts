import { useCallback } from 'react';

import { IVinesTeam } from '@/apis/authz/team/typings.ts';
import { useSystemConfig } from '@/apis/common';

export const useGetDefaultLoginTeam = () => {
  const { data: oem } = useSystemConfig();
  return useCallback(
    (teamResponse: IVinesTeam[] | undefined) =>
      oem?.auth?.defaultOtherTeam && (teamResponse?.length ?? 0) > 1
        ? teamResponse?.[teamResponse.length - 1].id
        : teamResponse?.[0]?.id,
    [oem?.auth.defaultOtherTeam],
  );
};
