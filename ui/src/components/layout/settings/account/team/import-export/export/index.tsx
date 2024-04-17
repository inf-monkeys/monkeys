import React from 'react';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface IExportTeamProps extends React.ComponentPropsWithoutRef<'div'> {
  visible: boolean;
  setVisible: (visible: boolean) => void;
}

export const ExportTeam: React.FC<IExportTeamProps> = ({ visible, setVisible }) => {
  return (
    <Dialog open={visible} onOpenChange={setVisible}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>导出团队数据</DialogTitle>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
};
