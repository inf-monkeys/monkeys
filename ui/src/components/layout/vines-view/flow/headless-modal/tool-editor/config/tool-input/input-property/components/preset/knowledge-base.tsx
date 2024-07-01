import React, { useEffect, useState } from 'react';

import { ToolPropertyTypes } from '@inf-monkeys/monkeys';
import { useTranslation } from 'react-i18next';

import { useKnowledgeBases } from '@/apis/knowledge-base';
import { IVinesInputPropertyProps } from '@/components/layout/vines-view/flow/headless-modal/tool-editor/config/tool-input/input-property';
import { IVinesInputPresetProps } from '@/components/layout/vines-view/flow/headless-modal/tool-editor/config/tool-input/input-property/components/preset/index.tsx';
import { PresetWrapper } from '@/components/layout/vines-view/flow/headless-modal/tool-editor/config/tool-input/input-property/components/preset/wrapper.tsx';
import { useVinesTeam } from '@/components/router/guard/team.tsx';
import { IVinesToolPropertiesOption, VinesToolDefProperties } from '@/package/vines-flow/core/tools/typings.ts';
import { I18nContent } from '@/utils';

export const KnowledgeBaseSelector: React.FC<IVinesInputPropertyProps & IVinesInputPresetProps> = (props) => {
  const { t } = useTranslation();

  const { teamId } = useVinesTeam();
  const { data: vectorCollections, isLoading } = useKnowledgeBases();

  const [options, setOptions] = useState<IVinesToolPropertiesOption[]>([]);
  const [optionsVariableMapper, setOptionsVariableMapper] = useState<Record<string, VinesToolDefProperties>>({});

  useEffect(() => {
    if (!vectorCollections || !teamId) return;

    const opts = vectorCollections.map((m) => {
      const ownedByTeam = teamId === m.teamId;
      const displayName = ownedByTeam
        ? I18nContent(m.displayName)
        : t('workspace.flow-view.headless-modal.tool-editor.input.comps.preset.knowledge-base.display-name', {
            name: I18nContent(m.displayName),
          });
      return { name: displayName!, value: m.uuid };
    });
    setOptions(opts);

    const newOptionsVariableMapper: Record<string, VinesToolDefProperties> = {};
    opts.map(
      ({ name, value: optValue }) =>
        (newOptionsVariableMapper[optValue] = {
          displayName: name,
          name: optValue,
          type: t(
            'workspace.flow-view.headless-modal.tool-editor.input.comps.preset.knowledge-base.label',
          ) as ToolPropertyTypes,
        }),
    );
    setOptionsVariableMapper(newOptionsVariableMapper);
  }, [vectorCollections, teamId]);

  return (
    <PresetWrapper
      id="KnowledgeBase"
      name={t('workspace.flow-view.headless-modal.tool-editor.input.comps.preset.knowledge-base.label')}
      isLoading={isLoading}
      options={options}
      optionsVariableMapper={optionsVariableMapper}
      {...props}
    />
  );
};
