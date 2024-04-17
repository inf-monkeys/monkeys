import React from 'react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface IPayProps extends React.ComponentPropsWithoutRef<'div'> {
  amount: number;
  visible: boolean;
  setVisible: (visible: boolean) => void | Promise<void>;
}

export const Pay: React.FC<IPayProps> = ({ children, amount, visible, setVisible }) => {
  return (
    <Dialog open={visible} onOpenChange={setVisible}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>请使用微信扫码支付</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-4"></div>
        <DialogFooter>
          <Button variant="solid" onClick={() => {}}>
            充值
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
