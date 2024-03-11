import React, { useEffect, useState } from 'react';

import { Header } from '@/components/layout/vines-flow/headless-modal/tool-editor/header';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { VinesNode } from '@/package/vines-flow/core/nodes';
import { useVinesFlow } from '@/package/vines-flow/use.ts';
import VinesEvent from '@/utils/events';

interface IToolEditorProps extends React.ComponentPropsWithoutRef<'div'> {}

export const ToolEditor: React.FC<IToolEditorProps> = () => {
  const { vines } = useVinesFlow();

  const [node, setNode] = useState<VinesNode>();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleOpen = (nodeId: string) => {
      setOpen(true);
      setNode(vines.getNodeById(nodeId));
    };
    VinesEvent.on('flow-tool-editor', handleOpen);
    return () => {
      VinesEvent.off('flow-tool-editor', handleOpen);
    };
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-[50rem]">
        <DialogTitle asChild>
          <Header node={node} />
        </DialogTitle>
      </DialogContent>
    </Dialog>
  );
};
