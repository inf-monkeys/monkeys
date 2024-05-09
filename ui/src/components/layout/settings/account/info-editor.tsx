import React, { useEffect, useState } from 'react';

import { isEmpty } from 'lodash';
import { useTranslation } from 'react-i18next';
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
import { Input } from '@/components/ui/input';

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
  const { t } = useTranslation();

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
                toast.error(t('settings.account.info-editor.invalid-toast'));
                return;
              } else {
                value !== initialValue && onFinished?.(value);
                setVisible(false);
              }
            }}
          >
            {t('common.utils.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
