import React, { useEffect, useState } from 'react';

import { ToolPropertyTypes } from '@inf-monkeys/monkeys';
import { useTranslation } from 'react-i18next';

import { useComfyuiServers } from '@/apis/comfyui';
import { IVinesInputPropertyProps } from '@/components/layout/workspace/vines-view/flow/headless-modal/tool-editor/config/tool-input/input-property';
import { IVinesInputPresetProps } from '@/components/layout/workspace/vines-view/flow/headless-modal/tool-editor/config/tool-input/input-property/components/preset/index.tsx';
import { PresetWrapper } from '@/components/layout/workspace/vines-view/flow/headless-modal/tool-editor/config/tool-input/input-property/components/preset/wrapper.tsx';
import { IVinesToolPropertiesOption, VinesToolDefProperties } from '@/package/vines-flow/core/tools/typings.ts';

export const ComfyuiServerSelector: React.FC<IVinesInputPropertyProps & IVinesInputPresetProps> = (props) => {
  const { t } = useTranslation();

  const { data: comfyuiServers, isLoading } = useComfyuiServers();

  const [options, setOptions] = useState<IVinesToolPropertiesOption[]>([]);
  const [optionsVariableMapper, setOptionsVariableMapper] = useState<Record<string, VinesToolDefProperties>>({});

  useEffect(() => {
    if (!comfyuiServers) return;

    const opts = comfyuiServers.map((m) => {
      return { name: m.description, value: m.address };
    });
    setOptions(opts);

    const newOptionsVariableMapper: Record<string, VinesToolDefProperties> = {};
    opts.map(
      ({ name, value: optValue }) =>
        (newOptionsVariableMapper[optValue] = {
          displayName: name,
          name: optValue,
          type: t(
            'workspace.flow-view.headless-modal.tool-editor.input.comps.preset.comfyui-server',
          ) as ToolPropertyTypes,
        }),
    );
    setOptionsVariableMapper(newOptionsVariableMapper);
  }, [comfyuiServers]);

  return (
    <PresetWrapper
      id="ComfyuiServers"
      name={t('workspace.flow-view.headless-modal.tool-editor.input.comps.preset.comfyui-server')}
      isLoading={isLoading}
      options={options}
      optionsVariableMapper={optionsVariableMapper}
      {...props}
    />
  );
};
