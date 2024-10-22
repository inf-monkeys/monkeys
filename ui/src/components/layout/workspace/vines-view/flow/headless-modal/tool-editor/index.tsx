import React, { useEffect, useRef, useState } from 'react';

import { AnimatePresence, motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { ToolAdvancedConfig } from '@/components/layout/workspace/vines-view/flow/headless-modal/tool-editor/advanced-config';
import { ToolConfig } from '@/components/layout/workspace/vines-view/flow/headless-modal/tool-editor/config';
import { ToolDebug } from '@/components/layout/workspace/vines-view/flow/headless-modal/tool-editor/debug';
import { Header } from '@/components/layout/workspace/vines-view/flow/headless-modal/tool-editor/header';
import { Button } from '@/components/ui/button';
import { CodeEditor, JSONValue } from '@/components/ui/code-editor';
import { Dialog, DialogContent, DialogFooter, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.tsx';
import { VinesNode } from '@/package/vines-flow/core/nodes';
import { useVinesFlow } from '@/package/vines-flow/use.ts';
import { useCanvasStore } from '@/store/useCanvasStore';
import { useFlowStore } from '@/store/useFlowStore';
import { cn } from '@/utils';
import VinesEvent from '@/utils/events.ts';

interface IToolEditorProps extends React.ComponentPropsWithoutRef<'div'> {}

export const ToolEditor: React.FC<IToolEditorProps> = () => {
  const { t } = useTranslation();

  const isLatestWorkflowVersion = useFlowStore((s) => s.isLatestWorkflowVersion);
  const workflowId = useFlowStore((s) => s.workflowId);

  const disableDialogClose = useCanvasStore((s) => s.disableDialogClose);

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
        toast.error(t('workspace.flow-view.headless-modal.tool-editor.unknown-tool'));
      }
    } catch {
      /* empty */
    }
  };

  const nodeTask = node?.getRaw();
  const task = (nodeTask || {}) as JSONValue;

  const disabled = !isLatestWorkflowVersion;

  return (
    <Dialog open={open} onOpenChange={(val) => !disableDialogClose && setOpen(val)}>
      <DialogContent
        className="flex h-full max-h-[calc(100%-20%)] min-w-[55rem] max-w-[calc(100%-40%)] flex-col"
        onPointerDownOutside={(e) => {
          if (e.target instanceof Element && e.target.closest('[data-sonner-toast]')) {
            e.preventDefault();
          }
          vines.emit('update', vines.getRaw());
        }}
      >
        <DialogTitle asChild>
          <Header node={node} />
        </DialogTitle>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="inset-1 h-[calc(100%-8.3rem)]">
          <TabsList>
            <TabsTrigger value="config">{t('workspace.flow-view.headless-modal.tool-editor.tabs.config')}</TabsTrigger>
            {!disabled && (
              <TabsTrigger value="debug">{t('workspace.flow-view.headless-modal.tool-editor.tabs.debug')}</TabsTrigger>
            )}
            <TabsTrigger value="dev">{t('workspace.flow-view.headless-modal.tool-editor.tabs.dev')}</TabsTrigger>
            <TabsTrigger value="more-config">
              {t('workspace.flow-view.headless-modal.tool-editor.tabs.more-config')}
            </TabsTrigger>
          </TabsList>
          <AnimatePresence mode="popLayout">
            <motion.div
              key={activeTab}
              className="h-[calc(100%-4rem)] w-full [&>div[role=tabpanel]]:mt-4 [&>div[role=tabpanel]]:h-full"
              initial={{ x: 10, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -10, opacity: 0 }}
              transition={{ duration: activeTab === 'empty' ? 0 : 0.2 }}
            >
              {activeTab === 'config' && (
                <TabsContent value="config">
                  <ToolConfig nodeId={node?.id ?? ''} task={nodeTask} />
                </TabsContent>
              )}
              {activeTab === 'dev' && (
                <TabsContent value="dev">
                  <CodeEditor data={task} lineNumbers={4} onUpdate={handleRawUpdate} readonly={disabled} />
                </TabsContent>
              )}
              {activeTab === 'more-config' && (
                <TabsContent value="more-config">
                  <ToolAdvancedConfig nodeId={node?.id ?? ''} task={nodeTask} />
                </TabsContent>
              )}
              {activeTab === 'debug' && !disabled && (
                <TabsContent value="debug">
                  <ToolDebug task={nodeTask} workflowId={workflowId} />
                </TabsContent>
              )}
              {activeTab === 'empty' && <TabsContent value="empty" />}
            </motion.div>
          </AnimatePresence>
        </Tabs>
        <DialogFooter>
          <Button
            className={cn(disabled && 'hidden')}
            variant="outline"
            onClick={() => vines.emit('update', vines.getRaw())}
          >
            {t('workspace.flow-view.headless-modal.tool-editor.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
