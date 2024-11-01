import React, { useState } from 'react';

import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { IVinesTeam } from '@/apis/authz/team/typings.ts';
import { exportTeamDataAsBuiltInMarket } from '@/apis/data';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface IExportTeamAsBuiltInMarketProps extends React.ComponentPropsWithoutRef<'div'> {
  team?: IVinesTeam;
}

export const ExportTeamAsBuiltInMarket: React.FC<IExportTeamAsBuiltInMarketProps> = ({ team, children }) => {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const handleExport = async () => {
    if (!team?.id) {
      toast.warning(t('common.toast.loading'));
      return;
    }
    setIsLoading(true);
    toast.promise(exportTeamDataAsBuiltInMarket({ teamId: team.id, teamName: team.name }), {
      loading: t('common.operate.loading'),
      success: () => {
        setVisible(false);
        return t('common.operate.success');
      },
      error: t('common.operate.error'),
      finally: () => {
        setIsLoading(false);
      },
    });
  };
  return (
    <Dialog open={visible} onOpenChange={setVisible}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('settings.account.team.import-export.export-as-built-in-market.title')}</DialogTitle>
        </DialogHeader>
        <DialogFooter>
          <Button loading={isLoading} variant="solid" onClick={handleExport}>
            {t('common.utils.confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
