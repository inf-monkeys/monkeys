import React, { useEffect, useState } from 'react';

import { AnimatePresence, motion } from 'framer-motion';
import { CircleEllipsisIcon, Save } from 'lucide-react';

import { ToolInput } from '@/components/layout/vines-flow/headless-modal/tool-editor/config/tool-input';
import { ComplicateNodeHeader } from '@/components/layout/vines-flow/nodes/complicate/node/header.tsx';
import { Button } from '@/components/ui/button';
import { CodeEditor, JSONValue } from '@/components/ui/code-editor';
import { ScrollArea } from '@/components/ui/scroll-area.tsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.tsx';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { IVinesNodeCustomData, VinesTask } from '@/package/vines-flow/core/nodes/typings.ts';
import { IVinesVariableMap, VinesToolDef } from '@/package/vines-flow/core/tools/typings.ts';
import VinesEvent from '@/utils/events.ts';

interface IComplicateSimpleNodeProps {
  workflowId: string;
  workflowVersion: number;
  nodeId: string;
  task?: VinesTask;
  tool?: VinesToolDef;
  toolName: string;
  customData: IVinesNodeCustomData;
  variableMapper: Record<string, IVinesVariableMap>;
  onSaved?: () => void;
  onRawUpdate?: (data: string) => void;
  vinesUpdateRaw?: (nodeId: string, task: VinesTask, update: boolean) => void;
}

export const ComplicateSimpleNode: React.FC<IComplicateSimpleNodeProps> = ({
  workflowId,
  workflowVersion,
  nodeId,
  task,
  tool,
  toolName,
  customData,
  variableMapper,
  onSaved,
  onRawUpdate,
  vinesUpdateRaw,
}) => {
  const [activeTab, setActiveTab] = useState('config');

  const isUnSupport = !tool;
  useEffect(() => {
    isUnSupport && setActiveTab('dev');
  }, [isUnSupport]);

  return (
    <>
      <ComplicateNodeHeader tool={tool} toolName={toolName} customData={customData}>
        <div className="flex gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button icon={<Save />} size="small" variant="outline" onClick={onSaved} />
            </TooltipTrigger>
            <TooltipContent>保存配置</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                icon={<CircleEllipsisIcon />}
                size="small"
                variant="outline"
                onClick={(e) => VinesEvent.emit('canvas-context-menu', workflowId, e, 'NODE', nodeId)}
              />
            </TooltipTrigger>
            <TooltipContent>更多</TooltipContent>
          </Tooltip>
        </div>
      </ComplicateNodeHeader>
      <Tabs className="px-5" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          {tool && <TabsTrigger value="config">配置参数</TabsTrigger>}
          <TabsTrigger value="dev">开发模式</TabsTrigger>
          {tool && (
            <>
              <TabsTrigger value="more-config">高级配置</TabsTrigger>
              <TabsTrigger value="custom-config">自定义配置</TabsTrigger>
            </>
          )}
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
              <TabsContent className="mt-4 h-80" value="config">
                <ScrollArea className="h-full pr-2">
                  <ToolInput
                    nodeId={nodeId}
                    task={task}
                    tool={tool}
                    workflowVersion={workflowVersion}
                    updateRaw={vinesUpdateRaw}
                    variableMapper={variableMapper}
                  />
                </ScrollArea>
              </TabsContent>
            )}
            {activeTab === 'dev' && (
              <TabsContent className="mt-4 h-80" value="dev">
                <CodeEditor data={(task || {}) as JSONValue} lineNumbers={4} onUpdate={onRawUpdate} />
              </TabsContent>
            )}
            {activeTab === 'more-config' && <TabsContent className="mt-4 h-80" value="more-config"></TabsContent>}
            {activeTab === 'custom-config' && <TabsContent className="mt-4 h-80" value="custom-config"></TabsContent>}
          </motion.div>
        </AnimatePresence>
      </Tabs>
    </>
  );
};
