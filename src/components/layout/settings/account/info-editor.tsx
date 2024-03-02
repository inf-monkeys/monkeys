import React, { useEffect, useState } from 'react';

import { isEmpty } from 'lodash';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input.tsx';

interface IInfoEditorProps extends React.ComponentPropsWithoutRef<'div'> {
  title: string;
  description?: string;
  placeholder?: string;
  initialValue?: string;
  onFinished?: (value: string) => void;
  disabled?: boolean;
}

export const InfoEditor: React.FC<IInfoEditorProps> = ({
  children,
  title,
  description,
  initialValue,
  placeholder,
  onFinished,
  disabled,
}) => {
  const [visible, setVisible] = useState(false);
  const [value, setValue] = useState(initialValue || '');

  useEffect(() => {
    initialValue && setValue(initialValue);
  }, [initialValue]);

  return (
    <Dialog open={visible} onOpenChange={(val) => !disabled && setVisible(val)}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <div className="gap-4 py-4">
          <Input placeholder={placeholder} maxLength={16} value={value} onChange={setValue} />
        </div>
        <DialogFooter>
          <Button
            variant="solid"
            onClick={() => {
              if (isEmpty(value)) {
                toast.error('请输入有效的内容');
                return;
              } else {
                value !== initialValue && onFinished?.(value);
                setVisible(false);
              }
            }}
          >
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
