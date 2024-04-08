import React from 'react';

import { KeySquare } from 'lucide-react';

import { AccountTypes } from '@/components/layout/ugc/external-account/list.tsx';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface IVinesExternalAccountProps {}

export const VinesExternalAccount: React.FC<IVinesExternalAccountProps> = () => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button icon={<KeySquare />} variant="outline" size="small">
          管理外部账号
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[50rem]">
        <DialogTitle>管理外部账号</DialogTitle>
        <AccountTypes />
      </DialogContent>
    </Dialog>
  );
};
