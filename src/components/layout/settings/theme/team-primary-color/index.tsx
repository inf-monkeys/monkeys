import React, { useEffect, useState } from 'react';

import { ColorPicker } from '@mantine/core';
import { set } from 'lodash';
import { toast } from 'sonner';

import { updateTeam } from '@/apis/authz/team';
import { useVinesTeam } from '@/components/router/guard/team.tsx';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card.tsx';
import usePaletteStore from '@/store/usePaletteStore.ts';

interface ITeamPrimaryColorProps extends React.ComponentPropsWithoutRef<'div'> {}

export const TeamPrimaryColor: React.FC<ITeamPrimaryColorProps> = () => {
  const { team } = useVinesTeam();

  const [tempColor, onChange] = useState('#62ab31');

  const { setValue, value } = usePaletteStore();

  useEffect(() => {
    value && setValue(value);
  }, [value]);

  const handleUpdate = () => {
    if (!team) {
      toast.error('团队不存在');
      return;
    }
    set(team, 'customTheme.primaryColor', tempColor);
    toast.promise(updateTeam({ customTheme: team.customTheme }), {
      loading: '正在更新主题色',
      success: '主题色更新成功',
      error: '主题色更新失败',
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>团队主题色</CardTitle>
        <CardDescription>你可以在这里设置团队的主题色，系统将自动生成对应的配色方案</CardDescription>
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
        <span className="text-xs text-gray-10">预览状态下将不会保存</span>
        <Button variant="outline" size="small" onClick={handleUpdate}>
          更新
        </Button>
      </CardFooter>
    </Card>
  );
};
