import React, { useState } from 'react';

import { get } from 'lodash';
import { FolderSync } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { initTeam } from '@/apis/authz/team';
import { useSystemConfig } from '@/apis/common';
import { useVinesTeam } from '@/components/router/guard/team';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useTeamStatusStore } from '@/store/useTeamStatusStore';

interface IInitTeamButtonProps extends React.ComponentPropsWithoutRef<'div'> {
  size?: 'icon' | 'default';
}

export const InitTeamButton: React.FC<IInitTeamButtonProps> = ({ className, size = 'default' }) => {
  const { t } = useTranslation();

  const { data: oem } = useSystemConfig();

  const initTeamEnabled = get(oem, ['theme', 'initTeam'], true);

  const { teamId } = useVinesTeam();

  const [isLoading, setIsLoading] = useState(false);

  const refreshTeamStatus = useTeamStatusStore((state) => state.refreshTeamStatus);

  const handleInitTeam = () => {
    if (!teamId) {
      toast.warning(t('common.toast.loading'));
      return;
    }
    setIsLoading(true);
    toast.promise(initTeam(teamId), {
      loading: t('common.update.loading'),
      success: () => {
        refreshTeamStatus(teamId);
        return t('common.update.success');
      },
      error: t('common.update.error'),
      finally: () => {
        setIsLoading(false);
      },
    });
  };

  return initTeamEnabled ? (
    size === 'icon' ? (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            loading={isLoading}
            onClick={handleInitTeam}
            className={className}
            variant="outline"
            icon={<FolderSync />}
          />
        </TooltipTrigger>
        <TooltipContent>{t('common.init-team-button.tooltip')}</TooltipContent>
      </Tooltip>
    ) : (
      <Button
        loading={isLoading}
        onClick={handleInitTeam}
        className={className}
        variant="outline"
        icon={<FolderSync />}
      >
        {t('common.init-team-button.tooltip')}
      </Button>
    )
  ) : null;
};
