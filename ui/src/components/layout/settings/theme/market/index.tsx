import React from 'react';

import { useSWRConfig } from 'swr';

import dayjs from 'dayjs';
import { toast } from 'sonner';

import { useCreateTheme, useThemeMarket } from '@/apis/theme';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.tsx';
import { ScrollArea } from '@/components/ui/scroll-area.tsx';
import { useTranslation } from 'react-i18next';

interface IThemeMarketProps {}

export const ThemeMarket: React.FC<IThemeMarketProps> = () => {
  const { t } = useTranslation();

  const { mutate } = useSWRConfig();
  const { data, error } = useThemeMarket();
  const { trigger, isMutating } = useCreateTheme();

  if (error instanceof Error && error.message === '404 NOT FOUND') {
    // 404 | Module not enabled
    return null;
  }

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
        <CardTitle>{t('settings.theme.market.title')}</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-56">
          <div className="flex flex-col gap-4">
            {data
              ?.filter((theme, i, arr) => arr.findIndex((t) => t.primaryColor === theme.primaryColor) === i)
              ?.map(({ primaryColor, name, updatedTimestamp }, i) => (
                <div key={i} className="flex items-center gap-4 border-b border-b-input p-4 pt-0">
                  <div style={{ backgroundColor: primaryColor }} className="size-8 rounded-full" />
                  <div className="flex flex-col">
                    <p className="font-bold leading-tight">{name}</p>
                    <span className="text-xs text-gray-10">
                      {t('common.utils.updated-at') + dayjs(updatedTimestamp).format('YYYY-MM-DD HH:mm:ss')}
                    </span>
                  </div>
                  <div className="flex flex-1 justify-end">
                    <Button
                      variant="outline"
                      size="small"
                      loading={isMutating}
                      onClick={() => handleCreateTheme(name, primaryColor)}
                    >
                      {t('settings.theme.market.add-to-team')}
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
