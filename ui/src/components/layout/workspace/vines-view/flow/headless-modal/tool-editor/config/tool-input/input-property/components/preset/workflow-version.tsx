import React, { useEffect, useState } from 'react';

import { ToolPropertyTypes } from '@inf-monkeys/monkeys';
import { get } from 'lodash';
import { useTranslation } from 'react-i18next';

import { useWorkflowVersions } from '@/apis/workflow/version';
import { IVinesInputPropertyProps } from '@/components/layout/workspace/vines-view/flow/headless-modal/tool-editor/config/tool-input/input-property';
import { IVinesInputPresetProps } from '@/components/layout/workspace/vines-view/flow/headless-modal/tool-editor/config/tool-input/input-property/components/preset/index.tsx';
import { PresetWrapper } from '@/components/layout/workspace/vines-view/flow/headless-modal/tool-editor/config/tool-input/input-property/components/preset/wrapper.tsx';
import { IVinesToolPropertiesOption, VinesToolDefProperties } from '@/package/vines-flow/core/tools/typings.ts';

export const WorkflowVersionPresets: React.FC<IVinesInputPropertyProps & IVinesInputPresetProps> = (props) => {
  const { t } = useTranslation();

  const workflowId = get(props, 'def.extra.workflowId', '');
  const { data: workflowVersions, isLoading } = useWorkflowVersions(workflowId);

  const [options, setOptions] = useState<IVinesToolPropertiesOption[]>([]);
  const [optionsVariableMapper, setOptionsVariableMapper] = useState<Record<string, VinesToolDefProperties>>({});

  useEffect(() => {
    if (!workflowVersions) return;

    const opts = workflowVersions
      .sort((a, b) => b.version - a.version)
      .map((m) => {
        return { name: m.version.toString(), value: m.version };
      });
    setOptions(opts);

    const newOptionsVariableMapper: Record<string, VinesToolDefProperties> = {};
    opts.map(
      ({ name, value: optValue }) =>
        (newOptionsVariableMapper[optValue] = {
          displayName: name,
          name: optValue.toString(),
          type: t(
            'workspace.flow-view.headless-modal.tool-editor.input.comps.preset.workflow-version',
          ) as ToolPropertyTypes,
        }),
    );
    setOptionsVariableMapper(newOptionsVariableMapper);
  }, [workflowVersions]);

  return (
    <PresetWrapper
      id="WorkflowVersion"
      name={t('workspace.flow-view.headless-modal.tool-editor.input.comps.preset.workflow-version')}
      isLoading={isLoading}
      options={options}
      optionsVariableMapper={optionsVariableMapper}
      {...props}
    />
  );
};
