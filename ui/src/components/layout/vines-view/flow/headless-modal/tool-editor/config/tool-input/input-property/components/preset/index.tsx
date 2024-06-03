import React, { memo } from 'react';

import { BlockDefPropertyTypeOptions } from '@inf-monkeys/vines/src/models/BlockDefDto.ts';
import { get } from 'lodash';

import { IVinesInputPropertyProps } from '@/components/layout/vines-view/flow/headless-modal/tool-editor/config/tool-input/input-property';
import { ForkJoinBranchPresets } from '@/components/layout/vines-view/flow/headless-modal/tool-editor/config/tool-input/input-property/components/preset/fork-join-branch.tsx';
import { KnowledgeBaseSelector } from '@/components/layout/vines-view/flow/headless-modal/tool-editor/config/tool-input/input-property/components/preset/knowledge-base';
import { LlmModelPresets } from '@/components/layout/vines-view/flow/headless-modal/tool-editor/config/tool-input/input-property/components/preset/llm-model.tsx';
import { SdModelPresets } from '@/components/layout/vines-view/flow/headless-modal/tool-editor/config/tool-input/input-property/components/preset/sd-model.tsx';
import { WorkflowVersionPresets } from '@/components/layout/vines-view/flow/headless-modal/tool-editor/config/tool-input/input-property/components/preset/workflow-version.tsx';
import { WorkflowPresets } from '@/components/layout/vines-view/flow/headless-modal/tool-editor/config/tool-input/input-property/components/preset/workflow.tsx';

import { ComfyuiServerSelector } from './comfyui-server';
import { ComfyuiWorkflowsSelector } from './comfyui-workflow';
import { SqlKnowledgeBaseSelector } from './sql-knowledge-base';
import { ToolSelector } from './tool';

export interface IVinesInputPresetProps {
  typeOptions: BlockDefPropertyTypeOptions;
  componentMode: 'component' | 'input';
  setComponentMode: React.Dispatch<React.SetStateAction<'component' | 'input'>>;
}

export const PresetInput: React.FC<IVinesInputPropertyProps & IVinesInputPresetProps> = memo((rest) => {
  const assetType = get(rest?.typeOptions, 'assetType', null);

  return (
    <div className="relative min-h-8">
      {assetType === 'sd-model' && <SdModelPresets {...rest} />}
      {assetType === 'llm-model' && <LlmModelPresets {...rest} />}
      {assetType === 'knowledge-base' && <KnowledgeBaseSelector {...rest} />}
      {assetType === 'sql-knowledge-base' && <SqlKnowledgeBaseSelector {...rest} />}
      {assetType === 'comfyui-workflow' && <ComfyuiWorkflowsSelector {...rest} />}
      {assetType === 'comfyui-server' && <ComfyuiServerSelector {...rest} />}
      {assetType === 'tools' && <ToolSelector {...rest} />}
      {assetType === 'workflow-version' && <WorkflowVersionPresets {...rest} />}
      {assetType === 'fork-join-branch' && <ForkJoinBranchPresets {...rest} />}
      {assetType === 'workflow' && <WorkflowPresets {...rest} />}
    </div>
  );
});

PresetInput.displayName = 'PresetInput';
