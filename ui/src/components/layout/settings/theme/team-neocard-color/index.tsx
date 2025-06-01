import React, { useEffect, useState } from 'react';

import { set } from 'lodash';
import { HexColorPicker } from 'react-colorful';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { updateTeam } from '@/apis/authz/team';
import { useVinesTeam } from '@/components/router/guard/team.tsx';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card.tsx';
import { Input } from '@/components/ui/input';
import { useNeocardPaletteStore } from '@/store/usePaletteStore.ts';

interface ITeamNeocardColorProps extends React.ComponentPropsWithoutRef<'div'> {}

export const TeamNeocardColor: React.FC<ITeamNeocardColorProps> = () => {
  const { t } = useTranslation();

  // const { mutate } = useSWRConfig();
  const { team } = useVinesTeam();

  // const { trigger } = useCreateTheme();

  const [tempColor, onChange] = useState('#f1fafd');

  const setValue = useNeocardPaletteStore((s) => s.setValue);
  const value = useNeocardPaletteStore((s) => s.value);

  useEffect(() => {
    value && setValue(value);
  }, [value]);

  const handleUpdate = () => {
    if (!team) {
      toast.error(t('common.toast.team-not-found'));
      return;
    }
    set(team, 'customTheme.neocardColor', tempColor);
    setValue(tempColor);
    toast.promise(updateTeam({ customTheme: team.customTheme }), {
      loading: t('settings.theme.toast.neocard.update.loading'),
      success: t('settings.theme.toast.neocard.update.success'),
      error: t('settings.theme.toast.neocard.update.error'),
    });
  };

  // const handleCreateTheme = (name: string, color: string) => {
  //   toast.promise(trigger({ name, primaryColor: color }), {
  //     loading: t('settings.theme.toast.create.loading'),
  //     success: t('settings.theme.toast.create.success'),
  //     error: t('settings.theme.toast.create.error'),
  //     finally: () => void mutate('/api/theme'),
  //   });
  // };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('settings.theme.team-neocard-color.title')}</CardTitle>
        <CardDescription>{t('settings.theme.team-neocard-color.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <HexColorPicker
          className="!w-full"
          color={value}
          onChange={(color) => {
            onChange(color);
            setValue(color);
          }}
        />
      </CardContent>
      <CardFooter className="flex items-center justify-between">
        <Input
          className="max-w-24"
          value={tempColor}
          onChange={(val) => {
            onChange(val);
            if (/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(val)) {
              setValue(val);
            }
          }}
        />
        <div className="flex gap-2">
          {/* <SimpleInputDialog
            title={t('settings.theme.team-primary-color.operate.save.title')}
            placeholder={t('settings.theme.team-primary-color.operate.save.placeholder')}
            onFinished={(val) => handleCreateTheme(val, value)}
          >
            <Button variant="outline" size="small" disabled>
              {t('settings.theme.team-primary-color.operate.save.button')}
            </Button>
          </SimpleInputDialog> */}
          <Button variant="outline" size="small" onClick={handleUpdate}>
            {t('common.utils.update')}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};
