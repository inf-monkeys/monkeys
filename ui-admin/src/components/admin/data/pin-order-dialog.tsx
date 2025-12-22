import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { DataItem } from '@/types/data';
import { Loader2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

const MAX_PIN_ORDER_SMALLINT = 32767;

interface PinOrderDialogProps {
  open: boolean;
  item: Pick<DataItem, 'id' | 'name' | 'pinOrder'> | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: (pinOrder: number) => Promise<void>;
}

export function PinOrderDialog({
  open,
  item,
  onOpenChange,
  onConfirm,
}: PinOrderDialogProps) {
  const [pinOrderText, setPinOrderText] = useState('10');
  const [isTopPriority, setIsTopPriority] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const titleSuffix = useMemo(() => {
    const name = item?.name?.trim();
    if (name) return `：${name}`;
    if (item?.id) return `：${item.id}`;
    return '';
  }, [item?.id, item?.name]);

  useEffect(() => {
    if (!open) return;
    const existingPinOrder = item?.pinOrder ?? 0;
    const nextTopPriority = existingPinOrder === MAX_PIN_ORDER_SMALLINT;
    setIsTopPriority(nextTopPriority);
    setPinOrderText(String(existingPinOrder > 0 ? existingPinOrder : 10));
    setIsSubmitting(false);
  }, [open, item?.pinOrder]);

  const resolvedPinOrder = useMemo(() => {
    if (isTopPriority) return MAX_PIN_ORDER_SMALLINT;
    const value = Number(pinOrderText);
    const asInt = Number.isFinite(value) ? Math.trunc(value) : NaN;
    return asInt;
  }, [isTopPriority, pinOrderText]);

  const handleSubmit = async () => {
    if (!item?.id) {
      toast.error('无效的数据项');
      return;
    }

    if (!Number.isInteger(resolvedPinOrder)) {
      toast.error('请输入整数优先级');
      return;
    }

    if (resolvedPinOrder < 1 || resolvedPinOrder > MAX_PIN_ORDER_SMALLINT) {
      toast.error(`优先级范围为 1~${MAX_PIN_ORDER_SMALLINT}`);
      return;
    }

    try {
      setIsSubmitting(true);
      await onConfirm(resolvedPinOrder);
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error?.message || '置顶失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{`设置置顶优先级${titleSuffix}`}</DialogTitle>
          <DialogDescription>
            数值越大越靠前；取消置顶会把优先级重置为 0。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="pin-order">优先级</Label>
            <Input
              id="pin-order"
              type="number"
              min={1}
              max={MAX_PIN_ORDER_SMALLINT}
              step={1}
              value={pinOrderText}
              disabled={isTopPriority || isSubmitting}
              onChange={(e) => setPinOrderText(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              范围 1~{MAX_PIN_ORDER_SMALLINT}，越大越靠前。
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="pin-top-priority"
              checked={isTopPriority}
              disabled={isSubmitting}
              onCheckedChange={(checked) => setIsTopPriority(checked === true)}
            />
            <Label
              htmlFor="pin-top-priority"
              className="cursor-pointer select-none"
            >
              最优先（{MAX_PIN_ORDER_SMALLINT}）
            </Label>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !item?.id}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            确定
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
