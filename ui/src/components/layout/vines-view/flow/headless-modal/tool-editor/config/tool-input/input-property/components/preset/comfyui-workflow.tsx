import React, { useEffect, useState } from 'react';

import { BlockDefPropertyTypes } from '@inf-monkeys/vines';
import { useTranslation } from 'react-i18next';

import { useComfyuiWorkflows } from '@/apis/comfyui';
import { IVinesInputPropertyProps } from '@/components/layout/vines-view/flow/headless-modal/tool-editor/config/tool-input/input-property';
import { IVinesInputPresetProps } from '@/components/layout/vines-view/flow/headless-modal/tool-editor/config/tool-input/input-property/components/preset/index.tsx';
import { PresetWrapper } from '@/components/layout/vines-view/flow/headless-modal/tool-editor/config/tool-input/input-property/components/preset/wrapper.tsx';
import { IVinesToolPropertiesOption, VinesToolDefProperties } from '@/package/vines-flow/core/tools/typings.ts';

export const ComfyuiWorkflowsSelector: React.FC<IVinesInputPropertyProps & IVinesInputPresetProps> = (props) => {
  const { t } = useTranslation();

  const { data: comfyuiWorkflows, isLoading } = useComfyuiWorkflows();

  const [options, setOptions] = useState<IVinesToolPropertiesOption[]>([]);
  const [optionsVariableMapper, setOptionsVariableMapper] = useState<Record<string, VinesToolDefProperties>>({});

  useEffect(() => {
    if (!comfyuiWorkflows) return;

    const opts = comfyuiWorkflows.map((m) => {
      return { name: m.displayName, value: m.id };
    });
    setOptions(opts);

    const newOptionsVariableMapper: Record<string, VinesToolDefProperties> = {};
    opts.map(
      ({ name, value: optValue }) =>
        (newOptionsVariableMapper[optValue] = {
          displayName: name,
          name: optValue,
          type: t(
            'workspace.flow-view.headless-modal.tool-editor.input.comps.preset.comfyui-workflow',
          ) as BlockDefPropertyTypes,
        }),
    );
    setOptionsVariableMapper(newOptionsVariableMapper);
  }, [comfyuiWorkflows]);

  return (
    <PresetWrapper
      id="ComfyuiWorkflows"
      name={t('workspace.flow-view.headless-modal.tool-editor.input.comps.preset.comfyui-workflow')}
      isLoading={isLoading}
      options={options}
      optionsVariableMapper={optionsVariableMapper}
      {...props}
    />
  );
};
