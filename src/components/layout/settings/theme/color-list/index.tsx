import React from 'react';

import { useSWRConfig } from 'swr';

import dayjs from 'dayjs';
import { set } from 'lodash';
import { Trash2 } from 'lucide-react';
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
  const { team } = useVinesTeam();
  const { mutate } = useSWRConfig();
  const { data } = useThemeList();

  const { setValue } = usePaletteStore();

  const handleDeleteTheme = (themeId: string) => {
    toast.promise(deleteTheme(themeId), {
      loading: '正在删除主题',
      success: '主题删除成功',
      error: '主题删除失败',
      finally: () => void mutate('/api/theme'),
    });
  };

  const handleUpdate = (color: string) => {
    if (!team) {
      toast.error('团队不存在');
      return;
    }
    setValue(color);
    set(team, 'customTheme.primaryColor', color);
    toast.promise(updateTeam({ customTheme: team.customTheme }), {
      loading: '正在更新主题色',
      success: '主题色更新成功',
      error: '主题色更新失败',
    });
  };

  const finalData = data?.filter((theme, i, arr) => arr.findIndex((t) => t.primaryColor === theme.primaryColor) === i);
  const dataLength = finalData?.length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>团队主题列表</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-56">
          <div className="flex flex-col gap-4">
            {finalData?.map(({ _id: id, primaryColor, name, updatedTimestamp }, i) => (
              <div key={i} className="flex items-center gap-4 border-b border-b-input p-4 pt-0">
                <div style={{ backgroundColor: primaryColor }} className="size-8 rounded-full" />
                <div className="flex flex-col">
                  <p className="font-bold leading-tight">{name}</p>
                  <span className="text-xs text-gray-10">
                    更新于：{dayjs(updatedTimestamp).format('YYYY-MM-DD HH:mm:ss')}
                  </span>
                </div>
                <div className="flex flex-1 justify-end gap-2">
                  <Button size="small" variant="outline" onClick={() => handleUpdate(primaryColor)}>
                    切换
                  </Button>
                  <Button
                    disabled={dataLength === 1}
                    icon={<Trash2 />}
                    size="small"
                    variant="outline"
                    className="text-red-10 [&_svg]:stroke-red-10"
                    onClick={() => handleDeleteTheme(id)}
                  >
                    删除
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
