import React, { useEffect, useState } from 'react';

import { KeyedMutator } from 'swr';

import { Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
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

interface ICreateNewApiKeyProps extends React.ComponentPropsWithoutRef<'div'> {
  mutate: KeyedMutator<IApiKey[] | undefined>;
}

export const CreateNewApiKey: React.FC<ICreateNewApiKeyProps> = ({ mutate }) => {
  const { t } = useTranslation();

  const [visible, setVisible] = useState(false);

  const [desc, setDesc] = useState('');
  useEffect(() => void (visible && setDesc('')), [visible]);

  const { team } = useVinesTeam();
  const { user } = useVinesUser();

  const handleCreateApiKey = () => {
    if (desc.trim() === '') {
      toast.warning('settings.api-key.header.toast.description-empty');
      return;
    }
    setVisible(false);
    toast.promise(createApiKey(desc), {
      success: t('common.create.success'),
      loading: t('common.create.loading'),
      error: t('common.create.error'),
      finally: () => void mutate(),
    });
  };

  return (
    <Dialog open={visible} onOpenChange={setVisible}>
      <DialogTrigger asChild>
        <Button variant="outline" size="small" icon={<Plus />}>
          {t('settings.api-key.header.create.button')}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('settings.api-key.header.create.title')}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid grid-cols-4 gap-4">
            <Label className="mt-4">{t('settings.api-key.header.create.belong.label')}</Label>
            <Card className="col-span-3">
              <CardContent className="p-3">
                <div className="flex flex-col gap-2 text-sm">
                  <div className="grid grid-cols-4">
                    <span>{t('settings.api-key.header.create.belong.create-user')}</span>
                    <div className="col-span-3 flex gap-1">
                      <Avatar className="size-6">
                        <AvatarImage
                          className="aspect-auto"
                          src={user?.photo}
                          alt={user?.name ?? t('common.utils.unknown-user')}
                        />
                        <AvatarFallback className="rounded-none p-2 text-xs">
                          {(user?.name ?? t('common.utils.unknown-user')).substring(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <span>{user?.name ?? t('common.utils.unknown-user')}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-4">
                    <span>{t('settings.api-key.header.create.belong.create-team')}</span>
                    <div className="col-span-3 flex gap-1">
                      <Avatar className="size-6">
                        <AvatarImage
                          className="aspect-auto"
                          src={team?.iconUrl}
                          alt={team?.name ?? t('common.utils.unknown-team')}
                        />
                        <AvatarFallback className="rounded-none p-2 text-xs">
                          {(team?.name ?? t('common.utils.unknown-team')).substring(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <span>{team?.name ?? t('common.utils.unknown-team')}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label>{t('settings.api-key.header.create.description.label')}</Label>
            <Input
              placeholder={t('settings.api-key.header.create.description.placeholder')}
              className="col-span-3"
              value={desc}
              onChange={setDesc}
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={() => setVisible(false)} variant="outline">
            {t('common.utils.cancel')}
          </Button>
          <Button variant="solid" onClick={handleCreateApiKey}>
            {t('common.utils.create')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
