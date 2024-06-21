import React, { useEffect, useState } from 'react';

import { ToolPropertyTypes, ToolType } from '@inf-monkeys/monkeys';

import { useToolLists } from '@/apis/tools';
import { IVinesInputPropertyProps } from '@/components/layout/vines-view/flow/headless-modal/tool-editor/config/tool-input/input-property';
import { IVinesInputPresetProps } from '@/components/layout/vines-view/flow/headless-modal/tool-editor/config/tool-input/input-property/components/preset/index.tsx';
import { PresetWrapper } from '@/components/layout/vines-view/flow/headless-modal/tool-editor/config/tool-input/input-property/components/preset/wrapper.tsx';
import { useVinesTeam } from '@/components/router/guard/team.tsx';
import { IVinesToolPropertiesOption, VinesToolDefProperties } from '@/package/vines-flow/core/tools/typings.ts';
import { getI18nContent } from '@/utils';

export const ToolSelector: React.FC<IVinesInputPropertyProps & IVinesInputPresetProps> = (props) => {
  const { teamId } = useVinesTeam();
  const { data: tools, isLoading } = useToolLists();

  const [options, setOptions] = useState<IVinesToolPropertiesOption[]>([]);
  const [optionsVariableMapper, setOptionsVariableMapper] = useState<Record<string, VinesToolDefProperties>>({});

  useEffect(() => {
    if (!tools || !teamId) return;

    const opts = tools
      .filter((x) => x.type === ToolType.SIMPLE)
      .filter((x) => !x.name.startsWith('llm:'))
      .map((m) => {
        return { name: getI18nContent(m.displayName) ?? '', value: m.name };
      });
    setOptions(opts);

    const newOptionsVariableMapper: Record<string, VinesToolDefProperties> = {};
    opts.map(
      ({ name, value: optValue }) =>
        (newOptionsVariableMapper[optValue] = {
          displayName: name,
          name: optValue,
          type: '工具' as ToolPropertyTypes,
        }),
    );
    setOptionsVariableMapper(newOptionsVariableMapper);
  }, [tools, teamId]);

  return (
    <PresetWrapper
      id="tool"
      name="工具"
      isLoading={isLoading}
      options={options}
      optionsVariableMapper={optionsVariableMapper}
      {...props}
    />
  );
};
