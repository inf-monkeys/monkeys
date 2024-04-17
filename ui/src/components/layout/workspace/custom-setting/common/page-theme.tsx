import React from 'react';

import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.tsx';

interface IPageThemeProps extends React.ComponentPropsWithoutRef<'div'> {}

export const PageTheme: React.FC<IPageThemeProps> = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>视图主题</CardTitle>
        <CardDescription>你可以为视图配置独立颜色主题</CardDescription>
      </CardHeader>
    </Card>
  );
};
