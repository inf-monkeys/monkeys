import React, { useEffect, useState } from 'react';

import { ToolPropertyTypes } from '@inf-monkeys/monkeys';
import { uniqBy } from 'lodash';
import { useTranslation } from 'react-i18next';
import { useBuiltInModels, useSDModels } from 'src/apis/sd';

import { IVinesInputPropertyProps } from '@/components/layout/vines-view/flow/headless-modal/tool-editor/config/tool-input/input-property';
import { IVinesInputPresetProps } from '@/components/layout/vines-view/flow/headless-modal/tool-editor/config/tool-input/input-property/components/preset/index.tsx';
import { PresetWrapper } from '@/components/layout/vines-view/flow/headless-modal/tool-editor/config/tool-input/input-property/components/preset/wrapper.tsx';
import { IVinesToolPropertiesOption, VinesToolDefProperties } from '@/package/vines-flow/core/tools/typings.ts';

export const SdModelPresets: React.FC<IVinesInputPropertyProps & IVinesInputPresetProps> = (props) => {
  const { t } = useTranslation();

  const { data: sdModels, isLoading: isSdModelsLoading } = useSDModels({ page: 1, limit: 9999 });
  const { data: builtInModels, isLoading: isBuiltInModelsLoading } = useBuiltInModels();

  const loading = isSdModelsLoading || isBuiltInModelsLoading;

  const [options, setOptions] = useState<IVinesToolPropertiesOption[]>([]);
  const [optionsVariableMapper, setOptionsVariableMapper] = useState<Record<string, VinesToolDefProperties>>({});

  useEffect(() => {
    if (!sdModels || !builtInModels) return;

    const opts = uniqBy(
      sdModels
        .concat(builtInModels)
        .filter((m) => m.modelId)
        .map((m) => ({ name: m.name, value: m.modelId })),
      (it) => it.value,
    );
    setOptions(opts);

    const newOptionsVariableMapper: Record<string, VinesToolDefProperties> = {};
    opts.map(
      ({ name, value: optValue }) =>
        (newOptionsVariableMapper[optValue] = {
          displayName: name,
          name: optValue,
          type: t('workspace.flow-view.headless-modal.tool-editor.input.comps.preset.sd-model') as ToolPropertyTypes,
        }),
    );
    setOptionsVariableMapper(newOptionsVariableMapper);
  }, [sdModels, builtInModels]);

  return (
    <PresetWrapper
      id="SdModel"
      name={t('workspace.flow-view.headless-modal.tool-editor.input.comps.preset.sd-model')}
      isLoading={loading && !Object.keys(optionsVariableMapper).length}
      options={options}
      optionsVariableMapper={optionsVariableMapper}
      {...props}
    />
  );
};
