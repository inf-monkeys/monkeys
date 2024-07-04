import React, { useState } from 'react';

import { useSWRConfig } from 'swr';

import { CreditCard } from 'lucide-react';
import { toast } from 'sonner';

import { usePaymentOrderCreate } from '@/apis/authz/team/payment';
import { IRechargeOrder } from '@/apis/authz/team/payment/typings.ts';
import { Pay } from '@/components/layout/settings/account/team-property/recharge/pay.tsx';
import { balanceFormat } from '@/components/layout/settings/account/utils.ts';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

interface IRechargeProps extends React.ComponentPropsWithoutRef<'div'> {}

export const Recharge: React.FC<IRechargeProps> = ({ children }) => {
  const { mutate } = useSWRConfig();

  const { trigger } = usePaymentOrderCreate();

  const [visible, setVisible] = useState(false);
  const [amount, setAmount] = useState(10000);
  const [inputAmount, setInputAmount] = useState('100');

  const [order, setOrder] = useState<IRechargeOrder | null>(null);

  const handleCreateOrder = () => {
    if (amount < 1) {
      toast.warning('请输入正确的金额，最小为 1 元');
      return;
    }
    if (amount > 1000000) {
      toast.warning('最大充值金额为 10000 元');
      return;
    }
    toast.promise(trigger({ amount }), {
      loading: '正在创建订单',
      success: (res) => {
        setVisible(false);
        res && setOrder(res);
        void mutate((key) => typeof key === 'string' && key.startsWith('/api/payment/orders?'));

        return '创建订单成功';
      },
      error: '创建订单失败',
    });
  };

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
              value={inputAmount}
              onChange={(v) => {
                setInputAmount(v);

                const value = Number(v);
                if (!isNaN(value)) {
                  setAmount(value * 100);
                }
              }}
            />
            <div className="flex gap-2 [&>*]:flex-grow">
              {[1, 10, 100, 300].map((buttonAmount, index) => (
                <Button
                  key={index}
                  onClick={() => {
                    setAmount(buttonAmount * 100);
                    setInputAmount(buttonAmount.toString());
                  }}
                  variant="outline"
                >
                  <span>{buttonAmount.toString()} 元</span>
                </Button>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              size="small"
              icon={<CreditCard />}
              disabled={amount < 1}
              onClick={handleCreateOrder}
            >
              充值 {balanceFormat(amount).join('.')} 元
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Pay order={order} />
    </>
  );
};
