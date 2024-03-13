import React from 'react';

import { useVinesFlow } from '@/package/vines-flow';
import { VinesToolDef } from '@/package/vines-flow/core/tools/typings.ts';

interface IToolOutputProps {
  tool?: VinesToolDef;
  nodeId?: string;
}

export const ToolOutput: React.FC<IToolOutputProps> = ({ tool, nodeId }) => {
  const { vines } = useVinesFlow();

  console.log(vines.getWorkflowVariables());

  return <></>;
};
