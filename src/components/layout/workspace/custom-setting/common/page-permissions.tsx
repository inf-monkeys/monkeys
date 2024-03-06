import React from 'react';

import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.tsx';

interface IPagePermissionsProps extends React.ComponentPropsWithoutRef<'div'> {}

export const PagePermissions: React.FC<IPagePermissionsProps> = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>视图权限</CardTitle>
        <CardDescription>你可以将视图分享给其他人，邀请对方和你一起查看、编辑、或者执行页面。</CardDescription>
      </CardHeader>
    </Card>
  );
};
