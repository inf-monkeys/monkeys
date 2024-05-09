import React from 'react';

import { useTranslation } from 'react-i18next';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface IExportTeamProps extends React.ComponentPropsWithoutRef<'div'> {
  visible: boolean;
  setVisible: (visible: boolean) => void;
}

export const ExportTeam: React.FC<IExportTeamProps> = ({ visible, setVisible }) => {
  const { t } = useTranslation();
  return (
    <Dialog open={visible} onOpenChange={setVisible}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('settings.account.team.import-export.export.title')}</DialogTitle>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
};
