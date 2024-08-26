import React, { useState } from 'react';

import { useNavigate } from '@tanstack/react-router';

import { zodResolver } from '@hookform/resolvers/zod';
import { Plus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { createTeam, useTeams } from '@/apis/authz/team';
import { useVinesRoute } from '@/components/router/use-vines-route.ts';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form.tsx';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea.tsx';
import { Tooltip } from '@/components/ui/tooltip';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { createTeamSchema, ICreateTeam } from '@/schema/settings/team.ts';

interface ICreateTeamProps extends React.ComponentPropsWithoutRef<'div'> {}

export const CreateTeam: React.FC<ICreateTeamProps> = () => {
  const { t } = useTranslation();

  const { routeId } = useVinesRoute();
  const navigate = useNavigate({ from: location.pathname });

  const [visible, setVisible] = useState(false);

  const { mutate: mutateTeams } = useTeams();

  const form = useForm<ICreateTeam>({
    resolver: zodResolver(createTeamSchema),
    defaultValues: {
      name: '',
      description: '',
      iconUrl: '',
    },
  });

  const [isLoading, setIsLoading] = useState(false);

  const { data: teams } = useTeams();
  const [, setTeamId] = useLocalStorage<string>('vines-team-id', (teams ?? [])[0]?.id ?? '', false);

  const handleSubmit = form.handleSubmit(({ name, description, iconUrl }) => {
    setIsLoading(true);
    toast.promise(
      createTeam({
        name,
        description,
        iconUrl,
      }),
      {
        loading: t('common.create.loading'),
        success: () => {
          const previousData = teams;
          mutateTeams().then((data) => {
            const newData = data;
            if (!newData || !previousData) return;
            const newTeamIds = newData
              .map((raw) => raw.id)
              .filter((n) => !previousData.map((raw) => raw.id).includes(n));
            if (newTeamIds.length === 0) return;
            setTeamId(newTeamIds[0]);
            window['vinesTeamId'] = newTeamIds[0];
            void navigate({
              to: routeId?.replace(/.$/, ''),
              params: {
                teamId: newTeamIds[0],
              },
            });
          });
          setIsLoading(false);
          setVisible(false);
          form.reset();
          return t('common.create.success');
        },
        error: t('common.create.error'),
        finally: () => setIsLoading(false),
      },
    );
  });

  return (
    <Dialog open={visible} onOpenChange={setVisible}>
      <Tooltip content={t('settings.account.team.create.button-tooltip')}>
        <DialogTrigger asChild>
          <Button icon={<Plus />} size="small" variant="outline" />
        </DialogTrigger>
      </Tooltip>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('settings.account.team.create.title')}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form className="flex flex-col gap-2 space-y-1.5" onSubmit={handleSubmit}>
            <FormField
              name="name"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input placeholder={t('settings.account.team.create.name-placeholder')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              name="description"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea placeholder={t('settings.account.team.create.description-placeholder')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" loading={isLoading} variant="solid">
              {t('common.utils.confirm')}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
