import React, { memo, useEffect, useRef, useState } from 'react';

import { ComplicateNodes } from '@/components/layout/workspace/vines-view/flow/nodes/complicate';
import { NodeController } from '@/components/layout/workspace/vines-view/flow/nodes/controller.tsx';
import { SimplifyNodes } from '@/components/layout/workspace/vines-view/flow/nodes/simplify';
import { useRetimer } from '@/hooks/use-retimer.ts';
import { VinesNode } from '@/package/vines-flow/core/nodes';
import { IVinesFlowRenderType } from '@/package/vines-flow/core/typings.ts';
import { useVinesFlow } from '@/package/vines-flow/use.ts';

interface IVinesNodesProps extends React.ComponentPropsWithoutRef<'div'> {}

export const VinesNodes: React.FC<IVinesNodesProps> = memo(() => {
  const { vines, VINES_REFRESHER } = useVinesFlow();

  const reTimer = useRetimer();

  const [vinesNodes, setVinesNodes] = useState<VinesNode[]>([]);

  const [visible, setVisible] = useState(false);
  const [nodeStagger, setNodeStagger] = useState(0.2);

  const nodeLengthRef = useRef(0);

  useEffect(() => {
    const nodes = vines.getAllNodes();
    const nodeLength = nodes.length;
    // nodeLength !== nodeLengthRef.current && setVisible(false);

    reTimer(
      setTimeout(() => {
        nodeLengthRef.current = nodeLength;
        setVisible(nodeLength > 0);
        if (!nodeLength) return;

        setVinesNodes(nodes);
        setNodeStagger(nodeLength * 0.12 > 2 ? 2 / nodeLength : 0.12);
      }, 116) as unknown as number,
    );
  }, [VINES_REFRESHER]);

  return (
    <>
      {visible && <NodeController nodes={vinesNodes} nodeStagger={nodeStagger} />}
      {vines.renderOptions.type === IVinesFlowRenderType.COMPLICATE ? (
        <ComplicateNodes nodes={vinesNodes} nodeStagger={nodeStagger} visible={visible} />
      ) : (
        <SimplifyNodes nodes={vinesNodes} nodeStagger={nodeStagger} visible={visible} />
      )}
    </>
  );
});

VinesNodes.displayName = 'VinesNodes';
