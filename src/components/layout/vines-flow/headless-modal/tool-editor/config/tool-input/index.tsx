import React from 'react';

import { VinesNode } from '@/package/vines-flow/core/nodes';
import { VinesTask } from '@/package/vines-flow/core/nodes/typings.ts';
import { VinesToolDef } from '@/package/vines-flow/core/tools/typings.ts';

interface IToolInputProps {
  tool?: VinesToolDef;
  node?: VinesNode;
  updateRaw?: (nodeId: string, task: VinesTask) => void;
}

export const Index: React.FC<IToolInputProps> = ({ tool, node, updateRaw }) => {
  return <></>;
};
