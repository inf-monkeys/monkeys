import React from 'react';

import { AnimatePresence, motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

import { useTriggers, useTriggerTypes } from '@/apis/workflow/trigger';
import { VinesWorkflowInput } from '@/components/layout/vines-view/execution/workflow-input';
import { WorkflowApiConfig } from '@/components/layout/vines-view/flow/headless-modal/endpoint/start-tool/workflow-input-config/api-config';
import { InputConfig } from '@/components/layout/vines-view/flow/headless-modal/endpoint/start-tool/workflow-input-config/input-config';
import { WorkflowTrigger } from '@/components/layout/vines-view/flow/headless-modal/endpoint/start-tool/workflow-input-config/triggers';
import { InputPreview } from '@/components/layout/vines-view/flow/nodes/complicate/node/endpoint/start/input-preview.tsx';
import { ComplicateNodeHeader } from '@/components/layout/vines-view/flow/nodes/complicate/node/header.tsx';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.tsx';
import { useVinesFlow } from '@/package/vines-flow';
import { VinesToolDef } from '@/package/vines-flow/core/tools/typings.ts';
import { useCanvasStore } from '@/store/useCanvasStore';
import { useCanvasInteractionStore } from '@/store/useCanvasStore/interaction.ts';
import { CanvasStatus } from '@/store/useFlowStore/typings.ts';
import VinesEvent from '@/utils/events.ts';

export const ComplicateTriggerNode: React.FC = () => {
  const { t } = useTranslation();

  const { canvasMode, setCanvasMode } = useCanvasStore();
  const { setIsUserInteraction } = useCanvasInteractionStore();
  const { vines } = useVinesFlow();

  const { data: triggerTypes } = useTriggerTypes();
  const { data: triggers } = useTriggers(vines.workflowId, vines.version);

  const trigger = triggers?.find(({ enabled }) => enabled);
  const triggerType = triggerTypes?.find(({ type }) => type === trigger?.type);

  return (
    <>
      <ComplicateNodeHeader
        tool={{} as VinesToolDef}
        toolName=""
        customData={{
          icon: triggerType?.icon ?? '🚀',
          title: triggerType?.displayName ?? t('workspace.flow-view.vines.tools.start.name'),
          description: triggerType?.description ?? '',
        }}
      />
      <div className="relative px-5 [&>div]:h-[23.5rem]">
        <AnimatePresence>
          {canvasMode === CanvasStatus.WAIT_TO_RUNNING ? (
            <motion.div
              className="absolute top-0 flex w-[calc(100%-2.5rem)] flex-col gap-4"
              key="complicate-input-form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <VinesWorkflowInput
                inputs={vines.workflowInput}
                height={330}
                onSubmit={(inputData) => {
                  vines.start({ inputData });
                  setIsUserInteraction(null);
                  setTimeout(() => VinesEvent.emit('canvas-auto-zoom'), 80);
                  setCanvasMode(CanvasStatus.RUNNING);
                }}
              >
                <Button variant="outline" type="submit" size="small">
                  {t('workspace.flow-view.vines.execution')}
                </Button>
              </VinesWorkflowInput>
            </motion.div>
          ) : canvasMode === CanvasStatus.RUNNING ? (
            <InputPreview />
          ) : (
            <motion.div
              className="absolute top-0 w-[calc(100%-2.5rem)]"
              key="complicate-input-editor"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Tabs defaultValue="input">
                <TabsList>
                  <TabsTrigger value="input">{t('workspace.flow-view.endpoint.start-tool.tabs.input')}</TabsTrigger>
                  <TabsTrigger value="trigger">{t('workspace.flow-view.endpoint.start-tool.tabs.trigger')}</TabsTrigger>
                  <TabsTrigger value="api-config">
                    {t('workspace.flow-view.endpoint.start-tool.tabs.api-config')}
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="input">
                  <InputConfig className="h-[21rem]" contentWidth={308} />
                </TabsContent>
                <TabsContent value="trigger">
                  <WorkflowTrigger className="h-[21rem]" />
                </TabsContent>
                <TabsContent value="api-config">
                  <WorkflowApiConfig />
                </TabsContent>
              </Tabs>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};
