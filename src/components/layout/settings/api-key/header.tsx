import React, { useMemo, useState } from 'react';

import { KeyedMutator } from 'swr';

import { Plus } from 'lucide-react';
import { toast } from 'sonner';

import { createApiKey } from '@/apis/api-keys/api-key.ts';
import { IApiKey } from '@/apis/api-keys/typings.ts';
import { useVinesTeam } from '@/components/router/guard/team.tsx';
import { useVinesUser } from '@/components/router/guard/user.tsx';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar.tsx';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card.tsx';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label.tsx';

interface IApiKeyHeaderProps extends React.ComponentPropsWithoutRef<'div'> {
  mutate: KeyedMutator<IApiKey[] | undefined>;
}

export const ApiKeyHeader: React.FC<IApiKeyHeaderProps> = ({ mutate }) => {
  const { team } = useVinesTeam();
  const { user } = useVinesUser();

  const [visible, setVisible] = useState(false);
  const [desc, setDesc] = useState('');

  useMemo(() => {
    visible && setDesc('');
  }, [visible]);
  const handleCreateApiKey = () => {
    if (desc.trim() === '') {
      toast.warning('请输入用途描述');
      return;
    }
    setVisible(false);
    toast.promise(createApiKey(desc), {
      success: '创建成功',
      loading: '创建中......',
      error: '创建失败',
      finally: () => {
        mutate();
      },
    });
  };
  return (
    <Card>
      <CardContent className="flex justify-between gap-4 p-3">
        <Avatar className="size-10">
          <AvatarImage className="aspect-auto" src={team?.logoUrl} alt={team?.name ?? '未知团队'} />
          <AvatarFallback className="rounded-none p-2 text-xs">
            {(team?.name ?? '未知团队').substring(0, 2)}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-1 flex-col justify-center">
          <h3 className="line-clamp-1 font-semibold leading-tight">{team?.name ?? '未知团队'}</h3>
          <h3 className="line-clamp-1 text-xs">{team?.description ?? ''}</h3>
        </div>
        <div>
          <Dialog open={visible} onOpenChange={(val) => setVisible(val)}>
            <DialogTrigger asChild>
              <Button variant="solid" icon={<Plus />}>
                创建 API 密钥
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>创建 API 密钥</DialogTitle>
              </DialogHeader>
              <div className="grid gap-2">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label>密钥归属</Label>
                  <Card className="col-span-3">
                    <CardContent className="p-3">
                      <div className="flex flex-col gap-2 text-sm">
                        <div className="grid grid-cols-4">
                          <span>创建者</span>
                          <div className="col-span-3 flex gap-1">
                            <Avatar className="size-6">
                              <AvatarImage className="aspect-auto" src={user?.photo} alt={user?.name ?? '未知用户'} />
                              <AvatarFallback className="rounded-none p-2 text-xs">
                                {(user?.name ?? '未知用户').substring(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                            <span>{user?.name ?? '未知用户'}</span>
                          </div>
                        </div>
                        <div className="grid grid-cols-4">
                          <span>团队</span>
                          <div className="col-span-3 flex gap-1">
                            <Avatar className="size-6">
                              <AvatarImage className="aspect-auto" src={team?.logoUrl} alt={team?.name ?? '未知团队'} />
                              <AvatarFallback className="rounded-none p-2 text-xs">
                                {(team?.name ?? '未知团队').substring(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                            <span>{team?.name ?? '未知团队'}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label>用途描述</Label>
                  <Input placeholder="请输入用途描述，16 字内" className="col-span-3" value={desc} onChange={setDesc} />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={() => setVisible(false)}>取消</Button>
                <Button variant="solid" onClick={handleCreateApiKey}>
                  创建密钥
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
};
