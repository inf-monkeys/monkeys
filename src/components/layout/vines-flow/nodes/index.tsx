import React, { useCallback, useEffect, useRef, useState } from 'react';

import { NodeController } from '@/components/layout/vines-flow/nodes/controller.tsx';
import { SimplifyNodes } from '@/components/layout/vines-flow/nodes/simplify';
import { VinesNode } from '@/package/vines-flow/core/nodes';
import { IVinesFlowRenderType } from '@/package/vines-flow/core/typings.ts';
import { useVinesFlow } from '@/package/vines-flow/use.ts';
import { useRetimer } from '@/utils/use-retimer.ts';

interface IVinesNodesProps extends React.ComponentPropsWithoutRef<'div'> {}

export const VinesNodes: React.FC<IVinesNodesProps> = () => {
  const { vines, VINES_REFRESHER } = useVinesFlow();

  const reTimer = useRetimer();

  const [vinesNodes, setVinesNodes] = useState<VinesNode[]>([]);

  const [visible, setVisible] = useState(false);
  const [nodeStagger, setNodeStagger] = useState(0.2);

  const nodeLengthRef = useRef(0);
  const handleUpdate = useCallback(
    (nodes: VinesNode[], length: number) => {
      reTimer(
        setTimeout(() => {
          nodeLengthRef.current = length;
          setVisible(length > 0);
          if (!length) return;

          setVinesNodes(nodes);
          setNodeStagger(length * 0.12 > 2 ? 2 / length : 0.12);
        }, 116) as unknown as number,
      );
    },
    [reTimer],
  );

  useEffect(() => {
    const nodes = vines.getAllNodes();
    const nodeLength = nodes.length;
    nodeLength !== nodeLengthRef.current && setVisible(false);
    handleUpdate(nodes, nodeLength);
  }, [VINES_REFRESHER]);

  return (
    <>
      {visible && <NodeController nodes={vinesNodes} nodeStagger={nodeStagger} />}
      {vines.renderOptions.type === IVinesFlowRenderType.COMPLICATE ? (
        <></>
      ) : (
        <SimplifyNodes nodes={vinesNodes} nodeStagger={nodeStagger} visible={visible} />
      )}
    </>
  );
};
