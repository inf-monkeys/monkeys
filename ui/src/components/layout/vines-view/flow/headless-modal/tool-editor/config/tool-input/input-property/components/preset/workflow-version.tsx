import React, { useEffect, useState } from 'react';

import { ToolPropertyTypes } from '@inf-monkeys/monkeys';
import { get } from 'lodash';

import { useWorkflowVersions } from '@/apis/workflow/version';
import { IVinesInputPropertyProps } from '@/components/layout/vines-view/flow/headless-modal/tool-editor/config/tool-input/input-property';
import { IVinesInputPresetProps } from '@/components/layout/vines-view/flow/headless-modal/tool-editor/config/tool-input/input-property/components/preset/index.tsx';
import { PresetWrapper } from '@/components/layout/vines-view/flow/headless-modal/tool-editor/config/tool-input/input-property/components/preset/wrapper.tsx';
import { IVinesToolPropertiesOption, VinesToolDefProperties } from '@/package/vines-flow/core/tools/typings.ts';

export const WorkflowVersionPresets: React.FC<IVinesInputPropertyProps & IVinesInputPresetProps> = (props) => {
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
          type: '工作流版本' as ToolPropertyTypes,
        }),
    );
    setOptionsVariableMapper(newOptionsVariableMapper);
  }, [workflowVersions]);

  return (
    <PresetWrapper
      id="WorkflowVersion"
      name="工作流版本"
      isLoading={isLoading}
      options={options}
      optionsVariableMapper={optionsVariableMapper}
      {...props}
    />
  );
};
