import React, { useEffect, useState } from 'react';

import { BlockDefPropertyTypes } from '@inf-monkeys/vines';
import { useTranslation } from 'react-i18next';

import { useUgcTableData } from '@/apis/ugc';
import { IVinesInputPropertyProps } from '@/components/layout/vines-view/flow/headless-modal/tool-editor/config/tool-input/input-property';
import { IVinesInputPresetProps } from '@/components/layout/vines-view/flow/headless-modal/tool-editor/config/tool-input/input-property/components/preset/index.tsx';
import { PresetWrapper } from '@/components/layout/vines-view/flow/headless-modal/tool-editor/config/tool-input/input-property/components/preset/wrapper.tsx';
import { useVinesTeam } from '@/components/router/guard/team.tsx';
import { IVinesToolPropertiesOption, VinesToolDefProperties } from '@/package/vines-flow/core/tools/typings.ts';

export const SqlKnowledgeBaseSelector: React.FC<IVinesInputPropertyProps & IVinesInputPresetProps> = (props) => {
  const { t } = useTranslation();

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
      const displayName = ownedByTeam
        ? m.displayName
        : t('workspace.flow-view.headless-modal.tool-editor.input.comps.preset.sql-knowledge-base.display-name', {
            name: m.displayName,
          });
      return { name: displayName, value: m.uuid };
    });
    setOptions(opts);

    const newOptionsVariableMapper: Record<string, VinesToolDefProperties> = {};
    opts.map(
      ({ name, value: optValue }) =>
        (newOptionsVariableMapper[optValue] = {
          displayName: name,
          name: optValue,
          type: t(
            'workspace.flow-view.headless-modal.tool-editor.input.comps.preset.sql-knowledge-base.label',
          ) as BlockDefPropertyTypes,
        }),
    );
    setOptionsVariableMapper(newOptionsVariableMapper);
  }, [sqlKnowledgeBases, teamId]);

  return (
    <PresetWrapper
      id="SqlKnowledgeBase"
      name={t('workspace.flow-view.headless-modal.tool-editor.input.comps.preset.sql-knowledge-base.label')}
      isLoading={isLoading}
      options={options}
      optionsVariableMapper={optionsVariableMapper}
      {...props}
    />
  );
};
