import React from 'react';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input.tsx';

interface IPayProps extends React.ComponentPropsWithoutRef<'div'> {}

export const Pay: React.FC<IPayProps> = ({ children }) => {
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>充值</DialogTitle>
        </DialogHeader>
        <div className="gap-4 py-4">
          <Input placeholder="请输入充值金额，最小为 1" />
        </div>
      </DialogContent>
    </Dialog>
  );
};
