import React, { useEffect, useState } from 'react';

import { useSWRConfig } from 'swr';

import { ColorPicker } from '@mantine/core';
import { set } from 'lodash';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { updateTeam } from '@/apis/authz/team';
import { useCreateTheme } from '@/apis/theme';
import { InfoEditor } from '@/components/layout/settings/account/info-editor.tsx';
import { useVinesTeam } from '@/components/router/guard/team.tsx';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card.tsx';
import usePaletteStore from '@/store/usePaletteStore.ts';

interface ITeamPrimaryColorProps extends React.ComponentPropsWithoutRef<'div'> {}

export const TeamPrimaryColor: React.FC<ITeamPrimaryColorProps> = () => {
  const { t } = useTranslation();

  const { mutate } = useSWRConfig();
  const { team } = useVinesTeam();

  const { trigger } = useCreateTheme();

  const [tempColor, onChange] = useState('#62ab31');

  const { setValue, value } = usePaletteStore();

  useEffect(() => {
    value && setValue(value);
  }, [value]);

  const handleUpdate = () => {
    if (!team) {
      toast.error(t('common.toast.team-not-found'));
      return;
    }
    set(team, 'customTheme.primaryColor', tempColor);
    toast.promise(updateTeam({ customTheme: team.customTheme }), {
      loading: t('settings.theme.toast.update.loading'),
      success: t('settings.theme.toast.update.success'),
      error: t('settings.theme.toast.update.error'),
    });
  };

  const handleCreateTheme = (name: string, color: string) => {
    toast.promise(trigger({ name, primaryColor: color }), {
      loading: t('settings.theme.toast.create.loading'),
      success: t('settings.theme.toast.create.success'),
      error: t('settings.theme.toast.create.error'),
      finally: () => void mutate('/api/theme'),
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('settings.theme.team-primary-color.title')}</CardTitle>
        <CardDescription>{t('settings.theme.team-primary-color.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <ColorPicker
          fullWidth
          format="hex"
          value={value}
          onChange={(color) => {
            onChange(color);
            setValue(color);
          }}
        />
      </CardContent>
      <CardFooter className="flex items-center justify-between">
        <span className="text-xs text-gray-10">{t('settings.theme.team-primary-color.tip')}</span>
        <div className="flex gap-2">
          <InfoEditor
            title={t('settings.theme.team-primary-color.operate.save.title')}
            placeholder={t('settings.theme.team-primary-color.operate.save.placeholder')}
            onFinished={(val) => handleCreateTheme(val, value)}
          >
            <Button variant="outline" size="small">
              {t('settings.theme.team-primary-color.operate.save.button')}
            </Button>
          </InfoEditor>
          <Button variant="outline" size="small" onClick={handleUpdate}>
            {t('common.utils.update')}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};
