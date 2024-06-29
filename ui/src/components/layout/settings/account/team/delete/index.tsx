import React from 'react';

import { Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { deleteTeam, useTeams } from '@/apis/authz/team';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface IDeleteTeamProps extends React.ComponentPropsWithoutRef<'div'> {
  teamId?: string;
}

export const DeleteTeam: React.FC<IDeleteTeamProps> = ({ teamId }) => {
  const { t } = useTranslation();

  const { mutate: mutateTeams } = useTeams();

  const handleDeleteTeam = () => {
    if (teamId) {
      toast(t('settings.account.team.delete.confirm-content-1'), {
        action: {
          label: t('common.utils.confirm'),
          onClick: () =>
            toast(t('settings.account.team.delete.confirm-content-2'), {
              action: {
                label: t('common.utils.continue'),
                onClick: () => {
                  toast.promise(deleteTeam(teamId), {
                    success: () => {
                      void mutateTeams();
                      return t('settings.account.team.delete.deleted');
                    },
                    loading: t('common.delete.loading'),
                    error: t('common.delete.error'),
                  });
                },
              },
            }),
        },
      });
    } else {
      toast.warning(t('common.toast.loading'));
    }
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          size="small"
          className="[&>div>svg]:stroke-red-10"
          icon={<Trash2 />}
          onClick={handleDeleteTeam}
          variant="outline"
        />
      </TooltipTrigger>
      <TooltipContent>{t('settings.account.team.delete.button-tooltip')}</TooltipContent>
    </Tooltip>
  );
};
