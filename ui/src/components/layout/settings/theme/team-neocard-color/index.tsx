import React, { useEffect, useState } from 'react';

import { set } from 'lodash';
import { ArrowRightLeftIcon } from 'lucide-react';
import { HexColorPicker } from 'react-colorful';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { updateTeam, useTeams } from '@/apis/authz/team';
import { useVinesTeam } from '@/components/router/guard/team.tsx';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card.tsx';
import { Input } from '@/components/ui/input';
import { Tooltip } from '@/components/ui/tooltip';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { useAppStore } from '@/store/useAppStore';
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
  const darkMode = useAppStore((s) => s.darkMode);
  const setDarkMode = useAppStore((s) => s.setDarkMode);
  const [mode, setLocalDarkMode] = useLocalStorage<string>('vines-ui-dark-mode', 'auto', false);
  const { mutate } = useTeams();

  // Get the current theme's color
  const getCurrentThemeColor = () => {
    if (typeof value === 'string') {
      return value;
    }
    return mode === 'dark' ? value.dark : value.light;
  };
  // Update color for current theme only
  const updateCurrentThemeColor = (newColor: string) => {
    if (typeof value === 'string') {
      setValue(newColor);
      return;
    }

    if (mode === 'dark') {
      setValue({ light: value.light, dark: newColor });
    } else {
      setValue({ light: newColor, dark: value.dark });
    }
  };

  const currentThemeColor = getCurrentThemeColor() || '#f1fafd';

  useEffect(() => {
    onChange(currentThemeColor);
  }, [currentThemeColor]);

  const handleUpdate = async () => {
    if (!team) {
      toast.error(t('common.toast.team-not-found'));
      return;
    }

    // Store current team state for potential rollback
    const originalTeam = { ...team };
    const originalValue = value;

    // Update team config based on current theme
    if (mode === 'dark') {
      set(team, 'customTheme.neocardDarkColor', tempColor);
    } else {
      set(team, 'customTheme.neocardColor', tempColor);
    }

    // Optimistic update - immediately update local state
    updateCurrentThemeColor(tempColor);

    // Optimistically update the teams cache
    await mutate(
      (currentTeams) => {
        if (!currentTeams) return currentTeams;
        return currentTeams.map((t) =>
          t.id === team.id ? { ...t, customTheme: { ...t.customTheme, ...team.customTheme } } : t,
        );
      },
      false, // Don't revalidate immediately
    );

    // Make the API call with proper error handling and rollback
    toast.promise(
      updateTeam({ customTheme: team.customTheme })
        .catch(async (error) => {
          // Rollback optimistic updates on error
          updateCurrentThemeColor(getCurrentThemeColor.call({ value: originalValue }));
          await mutate((currentTeams) => {
            if (!currentTeams) return currentTeams;
            return currentTeams.map((t) => (t.id === team.id ? { ...t, customTheme: originalTeam.customTheme } : t));
          }, false);
          throw error;
        })
        .then(() => {
          // Revalidate to ensure consistency after successful update
          void mutate();
        }),
      {
        loading: t('settings.theme.toast.neocard.update.loading'),
        success: t('settings.theme.toast.neocard.update.success'),
        error: t('settings.theme.toast.neocard.update.error'),
      },
    );
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
      <CardHeader className="relative">
        <CardTitle>{t('settings.theme.team-neocard-color.title')}</CardTitle>
        <CardDescription className="mr-12">{t('settings.theme.team-neocard-color.description')}</CardDescription>
        <div className="absolute left-0 top-0 !mt-0 flex size-full items-center justify-end pr-[22px]">
          <Tooltip content={t('settings.theme.team-neocard-color.toggle-theme')}>
            <Button
              variant="outline"
              icon={<ArrowRightLeftIcon />}
              onClick={() => {
                setLocalDarkMode(mode === 'dark' ? 'light' : 'dark');
                setDarkMode(!darkMode);
              }}
            />
          </Tooltip>
        </div>
      </CardHeader>
      <CardContent>
        <HexColorPicker
          className="!w-full"
          color={currentThemeColor}
          onChange={(color) => {
            onChange(color);
            updateCurrentThemeColor(color);
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
              updateCurrentThemeColor(val);
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
