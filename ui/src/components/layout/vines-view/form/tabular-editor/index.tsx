import React from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.tsx';
import { Separator } from '@/components/ui/separator.tsx';

interface IVinesTabularEditorProps extends React.ComponentPropsWithoutRef<'div'> {
  setConfigVisible: React.Dispatch<React.SetStateAction<boolean>>;
}

export const VinesTabularEditor: React.FC<IVinesTabularEditorProps> = ({ setConfigVisible }) => {
  return (
    <Card className="size-full">
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle>编辑表单</CardTitle>
        <Button variant="outline" onClick={() => setConfigVisible(false)}>
          关闭
        </Button>
      </CardHeader>
      <CardContent>
        <Separator orientation="horizontal" />
        <div className="flex size-full"></div>
      </CardContent>
    </Card>
  );
};
