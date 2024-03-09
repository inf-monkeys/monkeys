import React, { useEffect } from 'react';

import { VinesFlowWrapper } from '@/components/layout/vines-flow/wrapper';
import { useVinesFlowWithPage } from '@/components/layout-wrapper/workspace/utils.ts';
import { useVinesFlow } from '@/package/vines-flow/use.ts';

interface IVinesFlowProps extends React.ComponentPropsWithoutRef<'div'> {}

export const VinesFlow: React.FC<IVinesFlowProps> = () => {
  const { workflow } = useVinesFlowWithPage();
  const { vines } = useVinesFlow();

  useEffect(() => {
    workflow && vines.update({ workflow });
  }, [workflow]);

  return <VinesFlowWrapper></VinesFlowWrapper>;
};
