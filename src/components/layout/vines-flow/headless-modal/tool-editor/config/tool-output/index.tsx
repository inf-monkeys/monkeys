import React from 'react';

import { VinesToolDef } from '@/package/vines-flow/core/tools/typings.ts';

interface IToolOutputProps {
  tool?: VinesToolDef;
  nodeId?: string;
}

export const ToolOutput: React.FC<IToolOutputProps> = ({ tool, nodeId }) => {
  return <></>;
};
