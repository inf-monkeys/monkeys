import React from 'react';

import { useSWRConfig } from 'swr';

import dayjs from 'dayjs';
import { toast } from 'sonner';

import { useCreateTheme, useThemeMarket } from '@/apis/theme';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.tsx';
import { ScrollArea } from '@/components/ui/scroll-area.tsx';

interface IThemeMarketProps {}

export const ThemeMarket: React.FC<IThemeMarketProps> = () => {
  const { mutate } = useSWRConfig();
  const { data, error } = useThemeMarket();
  const { trigger, isMutating } = useCreateTheme();

  if (error instanceof Error && error.message === '404 NOT FOUND') {
    // 404 | Module not enabled
    return null;
  }

  const handleCreateTheme = (name: string, color: string) => {
    toast.promise(trigger({ name, primaryColor: color }), {
      loading: '正在添加主题',
      success: '主题添加成功',
      error: '主题添加失败',
      finally: () => void mutate('/api/theme'),
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>主题市场</CardTitle>
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
                      更新于：{dayjs(updatedTimestamp).format('YYYY-MM-DD HH:mm:ss')}
                    </span>
                  </div>
                  <div className="flex flex-1 justify-end">
                    <Button
                      variant="outline"
                      size="small"
                      loading={isMutating}
                      onClick={() => handleCreateTheme(name, primaryColor)}
                    >
                      添加到团队
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
