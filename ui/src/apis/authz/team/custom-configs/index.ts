import { set } from 'lodash';

import { useSystemConfig } from '@/apis/common';
import { useVinesTeam } from '@/components/router/guard/team';

import { updateTeam } from '..';
import { IVinesTeam } from '../typings';

export const useCustomConfigs = (): IVinesTeam['customTheme']['configs'] & {
  update: (key: keyof IVinesTeam['customTheme']['configs'], value: boolean) => Promise<IVinesTeam | undefined>;
} => {
  const { data: oemConfig } = useSystemConfig();
  const { team } = useVinesTeam();

  const showFormInImageDetail =
    team?.customTheme?.configs?.showFormInImageDetail ?? oemConfig?.theme.defaults.showFormInImageDetail;

  return {
    showFormInImageDetail,
    update: async (key: keyof IVinesTeam['customTheme']['configs'], value: boolean) => {
      if (!team) return;
      set(team, `customTheme.configs.${key}`, value);
      return await updateTeam({
        customTheme: team.customTheme,
      });
    },
  };
};
