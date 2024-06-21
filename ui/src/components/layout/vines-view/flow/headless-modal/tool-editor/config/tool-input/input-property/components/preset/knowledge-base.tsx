import React, { useEffect, useState } from 'react';

import { ToolPropertyTypes } from '@inf-monkeys/monkeys';

import { useKnowledgeBases } from '@/apis/knowledge-base';
import { IVinesInputPropertyProps } from '@/components/layout/vines-view/flow/headless-modal/tool-editor/config/tool-input/input-property';
import { IVinesInputPresetProps } from '@/components/layout/vines-view/flow/headless-modal/tool-editor/config/tool-input/input-property/components/preset/index.tsx';
import { PresetWrapper } from '@/components/layout/vines-view/flow/headless-modal/tool-editor/config/tool-input/input-property/components/preset/wrapper.tsx';
import { useVinesTeam } from '@/components/router/guard/team.tsx';
import { IVinesToolPropertiesOption, VinesToolDefProperties } from '@/package/vines-flow/core/tools/typings.ts';

export const KnowledgeBaseSelector: React.FC<IVinesInputPropertyProps & IVinesInputPresetProps> = (props) => {
  const { teamId } = useVinesTeam();
  const { data: vectorCollections, isLoading } = useKnowledgeBases();

  const [options, setOptions] = useState<IVinesToolPropertiesOption[]>([]);
  const [optionsVariableMapper, setOptionsVariableMapper] = useState<Record<string, VinesToolDefProperties>>({});

  useEffect(() => {
    if (!vectorCollections || !teamId) return;

    const opts = vectorCollections.map((m) => {
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
          type: '文本知识库' as ToolPropertyTypes,
        }),
    );
    setOptionsVariableMapper(newOptionsVariableMapper);
  }, [vectorCollections, teamId]);

  return (
    <PresetWrapper
      id="KnowledgeBase"
      name="文本知识库"
      isLoading={isLoading}
      options={options}
      optionsVariableMapper={optionsVariableMapper}
      {...props}
    />
  );
};
