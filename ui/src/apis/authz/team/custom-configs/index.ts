import { set } from 'lodash';

import { useSystemConfig } from '@/apis/common';
import { useVinesTeam } from '@/components/router/guard/team';

import { updateTeam } from '..';
import { IImagePreviewOperationBarStyle, IVinesTeam } from '../typings';

export const useCustomConfigs = (): IVinesTeam['customTheme']['configs'] & {
  update: (key: keyof IVinesTeam['customTheme']['configs'], value: any) => Promise<IVinesTeam | undefined>;
  isLoading: boolean;
} => {
  const { data: oemConfig, isLoading } = useSystemConfig();
  const { team } = useVinesTeam();

  const showFormInImageDetail =
    team?.customTheme?.configs?.showFormInImageDetail ?? oemConfig?.theme.defaults.showFormInImageDetail;

  const imagePreviewOperationBarStyle: IImagePreviewOperationBarStyle =
    team?.customTheme?.configs?.imagePreviewOperationBarStyle ?? 'normal';

  return {
    ...team?.customTheme?.configs,
    isLoading,
    imagePreviewOperationBarStyle,
    showFormInImageDetail,
    update: async (key: keyof IVinesTeam['customTheme']['configs'], value: any) => {
      if (!team) return;
      set(team, `customTheme.configs.${key}`, value);
      return await updateTeam({
        customTheme: team.customTheme,
      });
    },
  };
};
