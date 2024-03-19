import React from 'react';

import { useTriggers, useTriggerTypes } from '@/apis/workflow/trigger';
import { InputConfig } from '@/components/layout/vines-flow/headless-modal/endpoint/start-tool/workflow-input-config/input-config';
import { WorkflowTrigger } from '@/components/layout/vines-flow/headless-modal/endpoint/start-tool/workflow-input-config/triggers';
import { ComplicateNodeHeader } from '@/components/layout/vines-flow/nodes/complicate/node/header.tsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.tsx';
import { useVinesFlow } from '@/package/vines-flow';
import { VinesToolDef } from '@/package/vines-flow/core/tools/typings.ts';
import { readLocalStorageValue } from '@/utils';

export const ComplicateTriggerNode: React.FC = () => {
  const { vines } = useVinesFlow();

  const apikey = readLocalStorageValue('vines-apikey', '', false);
  const { data: triggerTypes } = useTriggerTypes(apikey);
  const { data: triggers } = useTriggers(vines.workflowId, vines.version, apikey);

  const trigger = triggers?.find(({ enabled }) => enabled);
  const triggerType = triggerTypes?.find(({ type }) => type === trigger?.type);

  return (
    <div className="absolute left-0 top-0 size-full">
      <ComplicateNodeHeader
        tool={{} as VinesToolDef}
        toolName=""
        customData={{
          icon: triggerType?.icon ?? '🚀',
          title: triggerType?.displayName ?? '开始',
          description: triggerType?.description ?? '',
        }}
      />
      <div className="w-full px-5">
        <Tabs defaultValue="input">
          <TabsList>
            <TabsTrigger value="input">输入配置</TabsTrigger>
            <TabsTrigger value="trigger">触发器</TabsTrigger>
          </TabsList>
          <TabsContent value="input">
            <InputConfig className="h-[21rem]" />
          </TabsContent>
          <TabsContent value="trigger">
            <WorkflowTrigger className="h-[21rem]" />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
