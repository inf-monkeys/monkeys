import React, { useCallback, useEffect, useState } from 'react';

import { ToolPropertyTypes } from '@inf-monkeys/monkeys';
import { AnimatePresence, motion } from 'framer-motion';
import { isString } from 'lodash';
import { useTranslation } from 'react-i18next';

import { useWorkflowList } from '@/apis/workflow';
import { IVinesInputPropertyProps } from '@/components/layout/workspace/vines-view/flow/headless-modal/tool-editor/config/tool-input/input-property';
import { IVinesInputPresetProps } from '@/components/layout/workspace/vines-view/flow/headless-modal/tool-editor/config/tool-input/input-property/components/preset/index.tsx';
import { StringInput } from '@/components/layout/workspace/vines-view/flow/headless-modal/tool-editor/config/tool-input/input-property/components/string.tsx';
import { VinesLoading } from '@/components/ui/loading';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.tsx';
import { IVinesToolPropertiesOption, VinesToolDefProperties } from '@/package/vines-flow/core/tools/typings.ts';
import { getI18nContent } from '@/utils';

export const WorkflowPresets: React.FC<IVinesInputPropertyProps & Omit<IVinesInputPresetProps, 'typeOptions'>> = (
  props,
) => {
  const { t } = useTranslation();

  const { componentMode, setComponentMode, value, onChange, disabled, ...childProps } = props;

  const { data: workflowList, isLoading } = useWorkflowList();

  const [options, setOptions] = useState<IVinesToolPropertiesOption[]>([]);
  const [optionsVariableMapper, setOptionsVariableMapper] = useState<Record<string, VinesToolDefProperties>>({});

  useEffect(() => {
    if (!workflowList) return;

    const opts = workflowList.map((m) => ({ name: getI18nContent(m.displayName)!, value: m.workflowId }));

    setOptions(opts);

    const newOptionsVariableMapper: Record<string, VinesToolDefProperties> = {};
    opts.map(
      ({ name, value: optValue }) =>
        (newOptionsVariableMapper[optValue] = {
          displayName: name,
          name: optValue,
          type: t(
            'workspace.flow-view.headless-modal.tool-editor.input.comps.preset.workflow.label',
          ) as ToolPropertyTypes,
        }),
    );
    setOptionsVariableMapper(newOptionsVariableMapper);
  }, [workflowList]);

  const handleOnSelectChange = useCallback(
    (value: unknown) => {
      onChange?.(value);
      setTimeout(() => setComponentMode('component'), 200);
    },
    [onChange, setComponentMode],
  );

  const [refresh, setRefresh] = useState(false);

  useEffect(() => {
    if (!workflowList) return;
    if (Object.keys(optionsVariableMapper).length && workflowList.length) {
      setRefresh(true);
      setTimeout(() => setRefresh(false), 132);
    }
  }, [optionsVariableMapper, workflowList]);

  const isEmptyOptions = !options.length;

  return (
    <AnimatePresence>
      {isLoading ? (
        <motion.div
          key="WorkflowPresets_loading"
          className="absolute left-0 top-0 flex h-8 w-full items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.1 }}
        >
          <VinesLoading />
        </motion.div>
      ) : componentMode === 'input' && !refresh ? (
        <motion.div
          key="WorkflowPresets_input"
          className="absolute left-0 top-0 w-full"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.1 }}
        >
          <Select
            onValueChange={handleOnSelectChange}
            defaultValue={isString(value) ? value : ''}
            disabled={isEmptyOptions}
          >
            <SelectTrigger>
              <SelectValue
                placeholder={
                  isEmptyOptions
                    ? t('workspace.flow-view.headless-modal.tool-editor.input.comps.preset.workflow.placeholder-empty')
                    : t('workspace.flow-view.headless-modal.tool-editor.input.comps.preset.workflow.placeholder-select')
                }
              />
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
          key="WorkflowPresets_component"
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
      )}
    </AnimatePresence>
  );
};
