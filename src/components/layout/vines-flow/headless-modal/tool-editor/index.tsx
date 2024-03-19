import React, { useEffect, useRef, useState } from 'react';

import { AnimatePresence, motion } from 'framer-motion';
import { toast } from 'sonner';

import { ToolConfig } from '@/components/layout/vines-flow/headless-modal/tool-editor/config';
import { Header } from '@/components/layout/vines-flow/headless-modal/tool-editor/header';
import { Button } from '@/components/ui/button';
import { CodeEditor, JSONValue } from '@/components/ui/code-editor';
import { Dialog, DialogContent, DialogFooter, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.tsx';
import { VinesNode } from '@/package/vines-flow/core/nodes';
import { useVinesFlow } from '@/package/vines-flow/use.ts';
import { useFlowStore } from '@/store/useFlowStore';
import { cn } from '@/utils';
import VinesEvent from '@/utils/events';

interface IToolEditorProps extends React.ComponentPropsWithoutRef<'div'> {}

export const ToolEditor: React.FC<IToolEditorProps> = () => {
  const { workflowId, disableDialogClose, isLatestWorkflowVersion } = useFlowStore();
  const { vines } = useVinesFlow();

  const [activeTab, setActiveTab] = useState('config');

  const [node, setNode] = useState<VinesNode>();
  const [open, setOpen] = useState(false);

  const nodeIdRef = useRef<string>('');
  useEffect(() => {
    const handleOpen = (_wid: string, nodeId: string) => {
      if (workflowId !== _wid) return;

      setOpen(true);
      nodeIdRef.current = nodeId;
      setNode(vines.getNodeById(nodeId));
      vines.generateWorkflowVariables();
      setActiveTab('empty');
      setTimeout(() => setActiveTab('config'));
    };
    VinesEvent.on('flow-tool-editor', handleOpen);
    return () => {
      VinesEvent.off('flow-tool-editor', handleOpen);
    };
  }, [workflowId]);

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
    <Dialog open={open} onOpenChange={(val) => !disableDialogClose && setOpen(val)}>
      <DialogContent className="max-w-[50rem]">
        <DialogTitle asChild>
          <Header node={node} />
        </DialogTitle>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="config">配置参数</TabsTrigger>
            <TabsTrigger value="dev">开发模式</TabsTrigger>
            <TabsTrigger value="more-config">高级配置</TabsTrigger>
          </TabsList>
          <AnimatePresence>
            <motion.div
              key={activeTab}
              className="w-full"
              initial={{ x: 10, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -10, opacity: 0 }}
              transition={{ duration: activeTab === 'empty' ? 0 : 0.2 }}
            >
              {activeTab === 'config' && (
                <TabsContent className="mt-4 h-[25em]" value="config">
                  <ToolConfig nodeId={node?.id ?? ''} task={node?.getRaw()} />
                </TabsContent>
              )}
              {activeTab === 'dev' && (
                <TabsContent className="mt-4 h-[25em]" value="dev">
                  <CodeEditor data={task} lineNumbers={4} onUpdate={handleRawUpdate} />
                </TabsContent>
              )}
              {activeTab === 'more-config' && <TabsContent className="mt-4 h-[25em]" value="more-config"></TabsContent>}
              {activeTab === 'empty' && <TabsContent className="mt-4 h-[25em]" value="empty"></TabsContent>}
            </motion.div>
          </AnimatePresence>
        </Tabs>
        <DialogFooter>
          <Button
            className={cn(!isLatestWorkflowVersion && 'hidden')}
            variant="outline"
            onClick={() => vines.emit('update', vines.getRaw())}
          >
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
