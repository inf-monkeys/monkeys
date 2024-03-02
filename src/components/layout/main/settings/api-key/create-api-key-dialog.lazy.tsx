import React, { useState } from 'react';

import { Info } from 'lucide-react';
import { toast } from 'sonner';

import { useTeams } from '@/apis/authz/team';
import { IVinesUser } from '@/apis/authz/user/typings.ts';
import { useCreateApiKey } from '@/apis/settings/apikey.ts';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input.tsx';
import { useLocalStorage } from '@/utils';

interface IApiKeySettingsCreateApiKeyDialogProps extends React.ComponentPropsWithoutRef<'div'> {
  open: boolean;
  onClose: () => void;
}

export const ApiKeySettingsCreateApiKeyDialog: React.FC<IApiKeySettingsCreateApiKeyDialogProps> = ({
  open,
  onClose,
}) => {
  const [user] = useLocalStorage<Partial<IVinesUser>>('vines-account', {});
  const [desc, setDesc] = useState('');
  const { data: teams } = useTeams();
  const [teamId] = useLocalStorage<string>('vines-team-id', (teams ?? [])[0]?.id ?? '', false);

  const currentTeam = (teams ?? []).find((team) => team.id === teamId);

  const { trigger } = useCreateApiKey();

  const handleCreateOkClick = async () => {
    if (desc.trim() === '') {
      toast.warning('请输入用途描述');
      return;
    }
    toast.promise(
      trigger({
        desc,
      }),
      {
        success: '创建成功',
        loading: '创建中......',
        error: '创建失败',
      },
    );
    onClose();
  };

  return (
    <Dialog open={open} onClose={() => onClose()}>
      <DialogContent>
        <DialogTitle>创建 API 密钥</DialogTitle>
        <div className="flex flex-col gap-2">
          <div>
            <div className="text-text1 mb-2 text-sm font-bold">密钥归属</div>
            <div className="flex flex-wrap items-center text-xs">
              <Info size={16} className="mr-1" />
              <span>创建者：</span>
              <span className="mx-1 text-primary">{user.name}</span>
              <span>，团队：</span>
              <span className="mx-1 text-primary">{currentTeam?.name}</span>
            </div>
          </div>

          <div className="grid gap-4 px-2 pb-4">
            <div className="grid-cols-5">
              <div className="text-text1 col-span-1 text-sm font-bold">用途描述</div>
              <Input
                placeholder="请输入用途描述，16 字内"
                maxLength={16}
                value={desc}
                onChange={setDesc}
                className="col-span-4"
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={() => onClose()}>取消</Button>
          <Button variant="solid" onClick={handleCreateOkClick}>
            创建密钥
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
