import React from 'react';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface IJoinPublicTeamProps extends React.ComponentPropsWithoutRef<'div'> {}

export const JoinPublicTeam: React.FC<IJoinPublicTeamProps> = ({ children }) => {
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>加入公开团队</DialogTitle>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
};
