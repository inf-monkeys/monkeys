import React, { useEffect, useRef, useState } from 'react';

import { toast } from 'sonner';

import { ToolConfig } from '@/components/layout/vines-flow/headless-modal/tool-editor/config';
import { Header } from '@/components/layout/vines-flow/headless-modal/tool-editor/header';
import { Button } from '@/components/ui/button';
import { CodeEditor, JSONValue } from '@/components/ui/code-editor';
import { Dialog, DialogContent, DialogFooter, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.tsx';
import { VinesNode } from '@/package/vines-flow/core/nodes';
import { useVinesFlow } from '@/package/vines-flow/use.ts';
import VinesEvent from '@/utils/events';

interface IToolEditorProps extends React.ComponentPropsWithoutRef<'div'> {}

export const ToolEditor: React.FC<IToolEditorProps> = () => {
  const { vines } = useVinesFlow();

  const [node, setNode] = useState<VinesNode>();
  const [open, setOpen] = useState(false);

  const nodeIdRef = useRef<string>('');
  useEffect(() => {
    const handleOpen = (nodeId: string) => {
      setOpen(true);
      nodeIdRef.current = nodeId;
      setNode(vines.getNodeById(nodeId));
    };
    VinesEvent.on('flow-tool-editor', handleOpen);
    return () => {
      VinesEvent.off('flow-tool-editor', handleOpen);
    };
  }, []);

  const handleRawUpdate = (data: string) => {
    try {
      const task = JSON.parse(data);
      if (node) {
        vines.updateRaw(nodeIdRef.current, task, false);
      } else {
        toast.error('工具不存在');
      }
    } catch {
      /* empty */
    }
  };

  const task = (node?.getRaw() || {}) as JSONValue;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-[50rem]">
        <DialogTitle asChild>
          <Header node={node} />
        </DialogTitle>
        <Tabs defaultValue="config">
          <TabsList>
            <TabsTrigger value="config">配置参数</TabsTrigger>
            <TabsTrigger value="dev">开发模式</TabsTrigger>
            <TabsTrigger value="more-config">高级配置</TabsTrigger>
          </TabsList>
          <TabsContent className="mt-4 h-[25em]" value="config">
            <ToolConfig node={node} />
          </TabsContent>
          <TabsContent className="mt-4 h-[25em]" value="dev">
            <CodeEditor data={task} lineNumbers={4} onUpdate={handleRawUpdate} />
          </TabsContent>
          <TabsContent className="mt-4 h-[25em]" value="more-config"></TabsContent>
        </Tabs>
        <DialogFooter>
          <Button variant="outline" onClick={() => vines.emit('update', vines.getRaw())}>
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
