import React from 'react';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface ICreateTeamProps extends React.ComponentPropsWithoutRef<'div'> {}

export const CreateTeam: React.FC<ICreateTeamProps> = ({ children }) => {
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>新建团队</DialogTitle>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
};
