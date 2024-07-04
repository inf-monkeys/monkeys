import React, { useEffect, useState } from 'react';

import { useSWRConfig } from 'swr';

import { useClipboard } from '@mantine/hooks';
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
import { cn, execCopy } from '@/utils';

interface IPayProps extends React.ComponentPropsWithoutRef<'div'> {
  order?: IRechargeOrder | null;
}

export const Pay: React.FC<IPayProps> = ({ children, order }) => {
  const { t } = useTranslation();

  const { mutate } = useSWRConfig();
  const clipboard = useClipboard();

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
    toast.success(amount ? `成功充值 ${balanceFormat(amount).join('.')} 元` : '充值成功');
  };

  const handleRecheck = async () => {
    toast.promise(mutateOrder(), {
      loading: '正在检查支付状态',
      success: (res) => {
        const payStatus = res?.status ?? '';
        const isPaySuccess = ['delivered', 'paid'].includes(payStatus);
        if (isPaySuccess) {
          void handlePaid(res?.amount);
        }

        return `支付状态：${payStatus === 'pending' ? '待支付' : isPaySuccess ? '已支付' : '订单失效'}`;
      },
      error: '支付状态检查失败',
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
          <DialogTitle>请使用微信扫码支付</DialogTitle>
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
                  <span className="text-xs text-gray-10">订单号：{data?.id ?? ''}</span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        className="scale-50"
                        variant="outline"
                        size="small"
                        icon={<Copy />}
                        onClick={() => {
                          const content = data?.id ?? '';
                          clipboard.copy(content);
                          if (!clipboard.copied && !execCopy(content)) toast.error(t('common.toast.copy-failed'));
                          else toast.success(t('common.toast.copy-success'));
                        }}
                      />
                    </TooltipTrigger>
                    <TooltipContent>{t('common.utils.copy')}</TooltipContent>
                  </Tooltip>
                </div>
              </div>
              <Alert>
                <AlertTitle className="font-bold">支付状态</AlertTitle>
                <AlertDescription className="flex items-center gap-2">
                  {status === 'pending' && (
                    <>
                      <LucideLoader2 size={16} className="animate-spin" />
                      <span>待支付，请尽快完成支付</span>
                    </>
                  )}
                  {status === 'paid' && (
                    <>
                      <Check size={16} />
                      <span>已支付</span>
                    </>
                  )}
                  {status === 'delivered' && (
                    <>
                      <CheckCheck size={16} />
                      <span>已到账</span>
                    </>
                  )}
                  {isOrderClose && (
                    <>
                      <MinusCircle size={16} />
                      <span>订单失效</span>
                    </>
                  )}
                </AlertDescription>
              </Alert>
            </>
          ) : (
            <h1 className="py-10 font-bold">订单信息获取失败</h1>
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
                  loading: '正在取消支付',
                  success: () => {
                    void mutate((key) => typeof key === 'string' && key.startsWith('/api/payment/orders?'));
                    return '订单已取消';
                  },
                  error: '取消支付失败',
                });
              }}
            >
              取消支付
            </Button>
          </DialogClose>
          <Button
            variant="outline"
            size="small"
            icon={<CheckCheck />}
            onClick={handleRecheck}
            disabled={isOrderClose || isOrderPaid}
          >
            我已完成支付
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
