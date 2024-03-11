import React, { useState } from 'react';

import { toast } from 'sonner';

import { Pay } from '@/components/layout/settings/account/team-property/recharge/pay.tsx';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input.tsx';

interface IRechargeProps extends React.ComponentPropsWithoutRef<'div'> {}

export const Recharge: React.FC<IRechargeProps> = ({ children }) => {
  const [visible, setVisible] = useState(false);
  const [payVisible, setPayVisible] = useState(false);
  const [amount, setAmount] = useState(0);

  return (
    <>
      <Dialog open={visible} onOpenChange={setVisible}>
        <DialogTrigger asChild>{children}</DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>充值</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <Input
              placeholder="请输入充值金额，最小为 1 元"
              value={amount.toString()}
              type="number"
              onChange={(v) => (v == '' ? setAmount(0) : setAmount(Number(v)))}
            />
            <div className="flex gap-2 [&>*]:flex-grow">
              {[1, 10, 100, 300].map((buttonAmount, index) => (
                <Button
                  key={index}
                  onClick={() => {
                    setAmount(buttonAmount);
                  }}
                >
                  <span>{buttonAmount.toString()} 元</span>
                </Button>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="solid"
              disabled={amount <= 1}
              onClick={() => {
                if (amount <= 1) {
                  toast.warning('请输入正确的金额，最小为 1 元');
                  return;
                }
                setVisible(false);
              }}
            >
              充值
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Pay visible={payVisible} setVisible={setPayVisible} amount={amount} />
    </>
  );
};
