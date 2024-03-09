import React, { useEffect, useState } from 'react';

import { NodeController } from '@/components/layout/vines-flow/nodes/controller.tsx';
import { SimplifyNodes } from '@/components/layout/vines-flow/nodes/simplify';
import { VinesNode } from '@/package/vines-flow/core/nodes';
import { IVinesFlowRenderType } from '@/package/vines-flow/core/typings.ts';
import { useVinesFlow } from '@/package/vines-flow/use.ts';

interface IVinesNodesProps extends React.ComponentPropsWithoutRef<'div'> {}

export const VinesNodes: React.FC<IVinesNodesProps> = () => {
  const { vines, VINES_REFRESHER } = useVinesFlow();

  const [vinesNodes, setVinesNodes] = useState<VinesNode[]>([]);

  const [visible, setVisible] = useState(false);
  const [nodeStagger, setNodeStagger] = useState(0.2);
  useEffect(() => {
    const nodes = vines.getAllNodes();
    const nodeLength = nodes.length;

    setVisible(nodeLength > 0);
    if (!nodeLength) return;

    setVinesNodes(nodes);
    setNodeStagger(nodeLength * 0.12 > 2 ? 2 / nodeLength : 0.12);
  }, [VINES_REFRESHER]);

  return (
    <>
      {vines.renderOptions.type === IVinesFlowRenderType.COMPLICATE ? (
        <></>
      ) : (
        <SimplifyNodes nodes={vinesNodes} nodeStagger={nodeStagger} visible={visible} />
      )}
      {visible && <NodeController nodes={vinesNodes} nodeStagger={nodeStagger} />}
    </>
  );
};
