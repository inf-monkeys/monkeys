import React from 'react';

import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface IPayProps extends React.ComponentPropsWithoutRef<'div'> {}

export const Pay: React.FC<IPayProps> = ({ children }) => {
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogTitle>充值</DialogTitle>
      </DialogContent>
    </Dialog>
  );
};
