import React from 'react';

import { useSWRConfig } from 'swr';

import dayjs from 'dayjs';
import { set } from 'lodash';
import { Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { updateTeam } from '@/apis/authz/team';
import { deleteTheme, useThemeList } from '@/apis/theme';
import { useVinesTeam } from '@/components/router/guard/team.tsx';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.tsx';
import { ScrollArea } from '@/components/ui/scroll-area.tsx';
import usePaletteStore from '@/store/usePaletteStore.ts';

interface IThemeColorListProps extends React.ComponentPropsWithoutRef<'div'> {}

export const ThemeColorList: React.FC<IThemeColorListProps> = () => {
  const { t } = useTranslation();

  const { team } = useVinesTeam();
  const { mutate } = useSWRConfig();
  const { data, error } = useThemeList();

  const { setValue } = usePaletteStore();

  const handleDeleteTheme = (themeId: string) => {
    toast.promise(deleteTheme(themeId), {
      loading: t('settings.theme.toast.delete.loading'),
      success: t('settings.theme.toast.delete.success'),
      error: t('settings.theme.toast.delete.error'),
      finally: () => void mutate('/api/theme'),
    });
  };

  const handleUpdate = (color: string) => {
    if (!team) {
      toast.error(t('common.toast.team-not-found'));
      return;
    }
    setValue(color);
    set(team, 'customTheme.primaryColor', color);
    toast.promise(updateTeam({ customTheme: team.customTheme }), {
      loading: t('settings.theme.toast.update.loading'),
      success: t('settings.theme.toast.update.success'),
      error: t('settings.theme.toast.update.error'),
    });
  };

  if (error instanceof Error && error.message === '404 NOT FOUND') {
    // 404 | Module not enabled
    return null;
  }

  const finalData = data?.filter((theme, i, arr) => arr.findIndex((t) => t.primaryColor === theme.primaryColor) === i);
  const dataLength = finalData?.length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('settings.theme.color-list.title')}</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-56">
          <div className="flex flex-col gap-4">
            {finalData?.map(({ id, primaryColor, name, updatedTimestamp }, i) => (
              <div key={i} className="flex items-center gap-4 border-b border-b-input p-4 pt-0">
                <div style={{ backgroundColor: primaryColor }} className="size-8 rounded-full" />
                <div className="flex flex-col">
                  <p className="font-bold leading-tight">{name}</p>
                  <span className="text-xs text-gray-10">
                    {t('common.utils.updated-at', { time: dayjs(updatedTimestamp).format('YYYY-MM-DD HH:mm:ss') })}
                  </span>
                </div>
                <div className="flex flex-1 justify-end gap-2">
                  <Button size="small" variant="outline" onClick={() => handleUpdate(primaryColor)}>
                    {t('common.utils.switch')}
                  </Button>
                  <Button
                    disabled={dataLength === 1}
                    icon={<Trash2 />}
                    size="small"
                    variant="outline"
                    className="text-red-10 [&_svg]:stroke-red-10"
                    onClick={() => handleDeleteTheme(id)}
                  >
                    {t('common.utils.delete')}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
