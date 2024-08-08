import React, { useState } from 'react';

import { useSWRConfig } from 'swr';

import { CreditCard } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { usePaymentOrderCreate } from '@/apis/authz/team/payment';
import { IRechargeOrder } from '@/apis/authz/team/payment/typings.ts';
import { Pay } from '@/components/layout/settings/account/team-property/recharge/pay.tsx';
import { balanceFormat } from '@/components/layout/settings/account/utils.ts';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { FieldGroup } from '@/components/ui/form.tsx';
import { NumberField, NumberFieldInput } from '@/components/ui/input/number.tsx';

interface IRechargeProps extends React.ComponentPropsWithoutRef<'div'> {}

export const Recharge: React.FC<IRechargeProps> = ({ children }) => {
  const { t } = useTranslation();

  const { mutate } = useSWRConfig();

  const { trigger } = usePaymentOrderCreate();

  const [visible, setVisible] = useState(false);
  const [amount, setAmount] = useState(10000);
  const [inputAmount, setInputAmount] = useState(100);

  const [order, setOrder] = useState<IRechargeOrder | null>(null);

  const handleCreateOrder = () => {
    if (amount < 1) {
      toast.warning(t('settings.payment.recharge.amount-too-small'));
      return;
    }
    if (amount > 1000000) {
      toast.warning(t('settings.payment.recharge.amount-too-large'));
      return;
    }
    toast.promise(trigger({ amount }), {
      loading: t('settings.payment.recharge.loading'),
      success: (res) => {
        setVisible(false);
        res && setOrder(res);
        void mutate((key) => typeof key === 'string' && key.startsWith('/api/payment/orders?'));

        return t('settings.payment.recharge.success');
      },
      error: t('settings.payment.recharge.error'),
    });
  };

  return (
    <>
      <Dialog open={visible} onOpenChange={setVisible}>
        <DialogTrigger asChild>{children}</DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('settings.payment.recharge.title')}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <NumberField
              value={inputAmount}
              onChange={(v) => {
                setInputAmount(v);

                const value = Number(v);
                if (!isNaN(value)) {
                  setAmount(value * 100);
                }
              }}
              formatOptions={{
                style: 'currency',
                currency: 'CNY',
                currencyDisplay: 'code',
                currencySign: 'accounting',
              }}
            >
              <FieldGroup>
                <NumberFieldInput placeholder={t('settings.payment.recharge.placeholder')} />
              </FieldGroup>
            </NumberField>
            <div className="flex gap-2 [&>*]:flex-grow">
              {[1, 10, 100, 300].map((buttonAmount, index) => (
                <Button
                  key={index}
                  onClick={() => {
                    setAmount(buttonAmount * 100);
                    setInputAmount(buttonAmount);
                  }}
                  variant="outline"
                >
                  <span>{t('settings.payment.recharge.pay', { amount: buttonAmount.toString() })}</span>
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
              {t('settings.payment.recharge.button', { amount: balanceFormat(amount).join('.') })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Pay order={order} />
    </>
  );
};
