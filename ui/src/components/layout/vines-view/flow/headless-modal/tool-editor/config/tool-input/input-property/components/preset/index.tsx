import React, { memo } from 'react';

import { BlockDefPropertyTypeOptions } from '@inf-monkeys/vines/src/models/BlockDefDto.ts';
import { get } from 'lodash';

import { IVinesInputPropertyProps } from '@/components/layout/vines-view/flow/headless-modal/tool-editor/config/tool-input/input-property';
import { ComfyuiModelPresets } from '@/components/layout/vines-view/flow/headless-modal/tool-editor/config/tool-input/input-property/components/preset/comfyui-model.tsx';
import { ForkJoinBranchPresets } from '@/components/layout/vines-view/flow/headless-modal/tool-editor/config/tool-input/input-property/components/preset/fork-join-branch.tsx';
import { KnowledgeBaseSelector } from '@/components/layout/vines-view/flow/headless-modal/tool-editor/config/tool-input/input-property/components/preset/knowledge-base';
import { LlmModelPresets } from '@/components/layout/vines-view/flow/headless-modal/tool-editor/config/tool-input/input-property/components/preset/llm-model.tsx';
import { SdModelPresets } from '@/components/layout/vines-view/flow/headless-modal/tool-editor/config/tool-input/input-property/components/preset/sd-model.tsx';
import { WorkflowPresets } from '@/components/layout/vines-view/flow/headless-modal/tool-editor/config/tool-input/input-property/components/preset/workflow.tsx';
import { WorkflowVersionPresets } from '@/components/layout/vines-view/flow/headless-modal/tool-editor/config/tool-input/input-property/components/preset/workflow-version.tsx';

export interface IVinesInputPresetProps {
  typeOptions: BlockDefPropertyTypeOptions;
  componentMode: 'component' | 'input';
  setComponentMode: React.Dispatch<React.SetStateAction<'component' | 'input'>>;
}

export const PresetInput: React.FC<IVinesInputPropertyProps & IVinesInputPresetProps> = memo(
  ({ typeOptions, ...childProps }) => {
    const assetType = get(typeOptions, 'assetType', null);

    return (
      <div className="relative min-h-8">
        {assetType === 'sd-model' && <SdModelPresets {...childProps} />}
        {assetType === 'llm-model' && <LlmModelPresets {...childProps} />}
        {assetType === 'knowledge-base' && <KnowledgeBaseSelector {...childProps} />}
        {assetType === 'workflow-version' && <WorkflowVersionPresets {...childProps} />}
        {assetType === 'fork-join-branch' && <ForkJoinBranchPresets {...childProps} />}
        {assetType === 'workflow' && <WorkflowPresets {...childProps} />}
        {assetType?.startsWith('comfyui-sd') && <ComfyuiModelPresets {...childProps} />}
      </div>
    );
  },
);

PresetInput.displayName = 'PresetInput';