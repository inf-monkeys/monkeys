import React, { useEffect, useState } from 'react';

import { useSWRConfig } from 'swr';

import { Check, CheckCheck, Copy, LucideLoader2, MinusCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import QRCode from 'react-qr-code';
import { toast } from 'sonner';

import { usePaymentOrder, usePaymentOrderClose } from '@/apis/authz/team/payment';
import { IRechargeOrder } from '@/apis/authz/team/payment/typings.ts';
import { balanceFormat } from '@/components/layout/settings/account/utils.ts';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert.tsx';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useCopy } from '@/hooks/use-copy.ts';
import { cn } from '@/utils';

interface IPayProps extends React.ComponentPropsWithoutRef<'div'> {
  order?: IRechargeOrder | null;
}

export const Pay: React.FC<IPayProps> = ({ children, order }) => {
  const { t } = useTranslation();

  const { mutate } = useSWRConfig();
  const { copy } = useCopy();

  const [orderId, setOrderId] = useState('');
  const [visible, setVisible] = useState(false);

  const { data, mutate: mutateOrder } = usePaymentOrder(orderId);
  const { trigger: closeOrderTrigger } = usePaymentOrderClose(orderId);

  useEffect(() => {
    if (order?.id && !children) {
      setOrderId(order.id);
      setVisible(true);
    }
  }, [order]);

  const handlePaid = async (amount = 0) => {
    if (['delivered', 'paid'].includes(order?.status ?? '')) {
      return;
    }
    await mutate('/api/payment/balances');
    await mutate((key) => typeof key === 'string' && key.startsWith('/api/payment/orders?'));
    setVisible(false);
    setOrderId('');
    toast.success(
      amount
        ? t('settings.payment.pay.success-paid', { amount: balanceFormat(amount).join('.') })
        : t('settings.payment.pay.success'),
    );
  };

  const handleRecheck = async () => {
    toast.promise(mutateOrder(), {
      loading: t('settings.payment.pay.re-check.loading'),
      success: (res) => {
        const payStatus = res?.status ?? '';
        const isPaySuccess = ['delivered', 'paid'].includes(payStatus);
        if (isPaySuccess) {
          void handlePaid(res?.amount);
        }

        return t('settings.payment.pay.re-check.success', {
          status:
            payStatus === 'pending'
              ? t('settings.payment.pay.pending')
              : isPaySuccess
                ? t('settings.payment.pay.paid')
                : t('settings.payment.pay.closed'),
        });
      },
      error: t('settings.payment.pay.re-check.error'),
    });
  };

  const status = data?.status ?? '';
  useEffect(() => {
    if (status === 'delivered') {
      void handlePaid(data?.amount);
    }
  }, [status]);

  const isOrderClose = status === 'closed';
  const isOrderPaid = ['delivered', 'paid'].includes(status);

  return (
    <Dialog
      open={visible}
      onOpenChange={(val) => {
        setVisible(val);
        if (val) {
          setOrderId(order?.id ?? '');
        } else {
          setOrderId('');
        }
      }}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('settings.payment.pay.title')}</DialogTitle>
        </DialogHeader>
        <div className="vines-center flex flex-col gap-4 pt-4">
          {order ? (
            <>
              <QRCode
                className={cn('size-32 rounded', (isOrderClose || isOrderPaid) && 'opacity-70 blur-sm')}
                value={isOrderClose || isOrderPaid ? 'Order Expiration' : order?.qrcode ?? ''}
              />
              <div className="vines-center -mt-3 flex flex-col">
                <span className={cn('text-sm text-gray-12', isOrderClose && 'line-through')}>
                  {balanceFormat(data?.amount ?? 0).join('.')} CNY
                </span>
                <div className="-my-2 flex items-center">
                  <span className="text-xs text-gray-10">
                    {t('settings.payment.pay.order-id', { orderId: data?.id ?? '' })}
                  </span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        className="scale-50"
                        variant="outline"
                        size="small"
                        icon={<Copy />}
                        onClick={() => copy(data?.id ?? '')}
                      />
                    </TooltipTrigger>
                    <TooltipContent>{t('common.utils.copy')}</TooltipContent>
                  </Tooltip>
                </div>
              </div>
              <Alert>
                <AlertTitle className="font-bold">{t('settings.payment.pay.order-status')}</AlertTitle>
                <AlertDescription className="flex items-center gap-2">
                  {status === 'pending' && (
                    <>
                      <LucideLoader2 size={16} className="animate-spin" />
                      <span>{t('settings.payment.pay.pending')}</span>
                    </>
                  )}
                  {status === 'paid' && (
                    <>
                      <Check size={16} />
                      <span>{t('settings.payment.pay.paid')}</span>
                    </>
                  )}
                  {status === 'delivered' && (
                    <>
                      <CheckCheck size={16} />
                      <span>{t('settings.payment.pay.delivered')}</span>
                    </>
                  )}
                  {isOrderClose && (
                    <>
                      <MinusCircle size={16} />
                      <span>{t('settings.payment.pay.closed')}</span>
                    </>
                  )}
                </AlertDescription>
              </Alert>
            </>
          ) : (
            <h1 className="py-10 font-bold">{t('settings.payment.pay.empty')}</h1>
          )}
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button
              variant="outline"
              size="small"
              disabled={isOrderClose || isOrderPaid}
              onClick={() => {
                toast.promise(closeOrderTrigger(), {
                  loading: t('settings.payment.pay.close-order.loading'),
                  success: () => {
                    void mutate((key) => typeof key === 'string' && key.startsWith('/api/payment/orders?'));
                    return t('settings.payment.pay.close-order.success');
                  },
                  error: t('settings.payment.pay.close-order.error'),
                });
              }}
            >
              {t('settings.payment.pay.close-order.label')}
            </Button>
          </DialogClose>
          <Button
            variant="outline"
            size="small"
            icon={<CheckCheck />}
            onClick={handleRecheck}
            disabled={isOrderClose || isOrderPaid}
          >
            {t('settings.payment.pay.re-check.label')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
