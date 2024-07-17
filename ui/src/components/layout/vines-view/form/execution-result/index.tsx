import React from 'react';

import { Card, CardContent } from '@/components/ui/card.tsx';

interface IVinesExecutionResultProps extends React.ComponentPropsWithoutRef<'div'> {}

export const VinesExecutionResult: React.FC<IVinesExecutionResultProps> = () => {
  return (
    <Card>
      <CardContent className="p-6"></CardContent>
    </Card>
  );
};
