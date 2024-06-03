import React, { useEffect, useState } from 'react';

import { BlockDefPropertyTypes } from '@inf-monkeys/vines';

import { useUgcTableData } from '@/apis/ugc';
import { IVinesInputPropertyProps } from '@/components/layout/vines-view/flow/headless-modal/tool-editor/config/tool-input/input-property';
import { IVinesInputPresetProps } from '@/components/layout/vines-view/flow/headless-modal/tool-editor/config/tool-input/input-property/components/preset/index.tsx';
import { PresetWrapper } from '@/components/layout/vines-view/flow/headless-modal/tool-editor/config/tool-input/input-property/components/preset/wrapper.tsx';
import { useVinesTeam } from '@/components/router/guard/team.tsx';
import { IVinesToolPropertiesOption, VinesToolDefProperties } from '@/package/vines-flow/core/tools/typings.ts';

export const SqlKnowledgeBaseSelector: React.FC<IVinesInputPropertyProps & IVinesInputPresetProps> = (props) => {
  const { teamId } = useVinesTeam();
  const { data: sqlKnowledgeBases, isLoading } = useUgcTableData({
    page: 1,
    limit: 99999,
    filter: {},
  });

  const [options, setOptions] = useState<IVinesToolPropertiesOption[]>([]);
  const [optionsVariableMapper, setOptionsVariableMapper] = useState<Record<string, VinesToolDefProperties>>({});

  useEffect(() => {
    if (!sqlKnowledgeBases || !teamId) return;

    const opts = sqlKnowledgeBases.data.map((m) => {
      const ownedByTeam = teamId === m.teamId;
      const displayName = ownedByTeam ? m.displayName : `${m.displayName}（其他团队授权）`;
      return { name: displayName, value: m.uuid };
    });
    setOptions(opts);

    const newOptionsVariableMapper: Record<string, VinesToolDefProperties> = {};
    opts.map(
      ({ name, value: optValue }) =>
        (newOptionsVariableMapper[optValue] = {
          displayName: name,
          name: optValue,
          type: '关系型知识库' as BlockDefPropertyTypes,
        }),
    );
    setOptionsVariableMapper(newOptionsVariableMapper);
  }, [sqlKnowledgeBases, teamId]);

  return (
    <PresetWrapper
      id="SqlKnowledgeBase"
      name="关系型知识库"
      isLoading={isLoading}
      options={options}
      optionsVariableMapper={optionsVariableMapper}
      {...props}
    />
  );
};
