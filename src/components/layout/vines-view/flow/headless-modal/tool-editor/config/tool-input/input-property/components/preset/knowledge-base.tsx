import React, { useCallback, useEffect, useState } from 'react';

import { BlockDefPropertyTypes } from '@inf-monkeys/vines';
import { CircularProgress } from '@nextui-org/progress';
import { AnimatePresence, motion } from 'framer-motion';
import { isString } from 'lodash';

import { useKnowledgeBases } from '@/apis/knowledge-base';
import { IVinesInputPropertyProps } from '@/components/layout/vines-view/flow/headless-modal/tool-editor/config/tool-input/input-property';
import { IVinesInputPresetProps } from '@/components/layout/vines-view/flow/headless-modal/tool-editor/config/tool-input/input-property/components/preset/index.tsx';
import { StringInput } from '@/components/layout/vines-view/flow/headless-modal/tool-editor/config/tool-input/input-property/components/string.tsx';
import { useVinesTeam } from '@/components/router/guard/team.tsx';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.tsx';
import { IVinesToolPropertiesOptions, VinesToolDefProperties } from '@/package/vines-flow/core/tools/typings.ts';

export const KnowledgeBaseSelector: React.FC<IVinesInputPropertyProps & Omit<IVinesInputPresetProps, 'typeOptions'>> = (
  props,
) => {
  const { componentMode, setComponentMode, value, onChange, disabled, ...childProps } = props;

  const { teamId } = useVinesTeam();
  const { data: vectorCollections, isLoading } = useKnowledgeBases();

  const [options, setOptions] = useState<IVinesToolPropertiesOptions[]>([]);
  const [optionsVariableMapper, setOptionsVariableMapper] = useState<Record<string, VinesToolDefProperties>>({});

  useEffect(() => {
    if (!vectorCollections || !teamId) return;

    const opts = vectorCollections.map((m) => {
      const ownedByTeam = teamId === m.teamId;
      const displayName = ownedByTeam ? m.displayName : `${m.displayName}（其他团队授权）`;
      return { name: displayName, value: m.name };
    });
    setOptions(opts);

    const newOptionsVariableMapper: Record<string, VinesToolDefProperties> = {};
    opts.map(
      ({ name, value: optValue }) =>
        (newOptionsVariableMapper[optValue] = {
          displayName: name,
          name: optValue,
          type: '文本数据集' as BlockDefPropertyTypes,
        }),
    );
    setOptionsVariableMapper(newOptionsVariableMapper);
  }, [vectorCollections, teamId]);

  const handleOnSelectChange = useCallback(
    (value: unknown) => {
      onChange?.(value);
      setTimeout(() => setComponentMode('component'), 200);
    },
    [onChange, setComponentMode],
  );

  const [refresh, setRefresh] = useState(false);

  useEffect(() => {
    if (!vectorCollections) return;
    if (Object.keys(optionsVariableMapper).length && vectorCollections.length) {
      setRefresh(true);
      setTimeout(() => setRefresh(false), 132);
    }
  }, [optionsVariableMapper, vectorCollections]);

  return (
    <AnimatePresence>
      {!isLoading && !refresh ? (
        componentMode === 'input' ? (
          <motion.div
            key="SdModelPresets_input"
            className="absolute left-0 top-0 w-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1 }}
          >
            <Select onValueChange={handleOnSelectChange} defaultValue={isString(value) ? value : ''}>
              <SelectTrigger>
                <SelectValue placeholder="您也可以选择预置选项" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {options.map((option, index) => (
                    <SelectItem key={index} value={option.value as string} disabled={disabled}>
                      {option.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </motion.div>
        ) : (
          <motion.div
            key="SdModelPresets_component"
            className="absolute left-0 top-0 w-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1 }}
          >
            <StringInput
              value={value}
              onChange={onChange}
              extraVariableMapper={optionsVariableMapper}
              disabled={disabled}
              {...childProps}
            />
          </motion.div>
        )
      ) : (
        <motion.div
          key="SdModelPresets_loading"
          className="absolute left-0 top-0 flex h-8 w-full items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.1 }}
        >
          <CircularProgress className="[&_circle:last-child]:stroke-vines-500" size="md" aria-label="Loading..." />
        </motion.div>
      )}
    </AnimatePresence>
  );
};
