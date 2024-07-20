import React, { useEffect, useState } from 'react';

import { AnimatePresence, motion } from 'framer-motion';
import { get, isArray, isString } from 'lodash';
import { useTranslation } from 'react-i18next';

import { IVinesInputPropertyProps } from '@/components/layout/vines-view/flow/headless-modal/tool-editor/config/tool-input/input-property';
import { CollectionInput } from '@/components/layout/vines-view/flow/headless-modal/tool-editor/config/tool-input/input-property/components/collection.tsx';
import { IVinesInputPresetProps } from '@/components/layout/vines-view/flow/headless-modal/tool-editor/config/tool-input/input-property/components/preset/index.tsx';
import { StringInput } from '@/components/layout/vines-view/flow/headless-modal/tool-editor/config/tool-input/input-property/components/string.tsx';
import { VinesLoading } from '@/components/ui/loading';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.tsx';
import { IVinesToolPropertiesOption, VinesToolDefProperties } from '@/package/vines-flow/core/tools/typings.ts';

interface IPresetWrapperProps<T extends Array<IVinesToolPropertiesOption>> {
  id: string;
  name?: string;
  isLoading?: boolean;
  options: T;
  optionsVariableMapper: Record<string, VinesToolDefProperties>;
}

export const PresetWrapper = <T extends Array<IVinesToolPropertiesOption>>({
  id,
  name = 'Option',
  isLoading = false,
  disabled,

  value,
  onChange,
  componentMode,
  setComponentMode,
  typeOptions,

  options,
  optionsVariableMapper,

  ...rest
}: IVinesInputPropertyProps & IVinesInputPresetProps & IPresetWrapperProps<T>): React.ReactNode => {
  const { t } = useTranslation();

  const multipleValues = get(typeOptions, 'multipleValues', false);

  const isArrayValue = isArray(value);

  const handleOnSelectChange = (select: unknown) => {
    if (multipleValues) {
      onChange?.(isArrayValue ? [...value, select] : value ? [value, select] : [select]);
    } else {
      onChange?.(select);
    }
    setTimeout(() => setComponentMode('component'), 80);
  };

  const isEmptyOptions = !options.length;

  const [refresh, setRefresh] = useState(false);

  useEffect(() => {
    if (Object.keys(optionsVariableMapper).length && options.length) {
      setRefresh(true);
      setTimeout(() => setRefresh(false), 132);
    }
  }, [optionsVariableMapper, options]);

  return (
    <AnimatePresence>
      {isLoading ? (
        <motion.div
          key={id + '_presets_loading'}
          className="absolute left-0 top-0 flex h-8 w-full items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.1 }}
        >
          <VinesLoading />
        </motion.div>
      ) : componentMode === 'input' ? (
        <motion.div
          key={id + '_presets_input'}
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
                    ? t('workspace.flow-view.headless-modal.tool-editor.input.comps.preset.placeholder-empty', { name })
                    : t('workspace.flow-view.headless-modal.tool-editor.input.comps.preset.placeholder-select', {
                        name,
                      })
                }
              />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {options.map((option, index) => (
                  <SelectItem
                    key={index}
                    value={option.value as string}
                    disabled={disabled || (multipleValues && isArrayValue && value.includes(option.value))}
                  >
                    {option.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </motion.div>
      ) : (
        !refresh && (
          <motion.div
            key={id + '_presets_component'}
            className="w-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1 }}
          >
            {multipleValues ? (
              <CollectionInput value={value} onChange={onChange} disabled={disabled} {...rest} />
            ) : (
              <StringInput
                value={value}
                onChange={onChange}
                extraVariableMapper={optionsVariableMapper}
                disabled={disabled}
                {...rest}
              />
            )}
          </motion.div>
        )
      )}
    </AnimatePresence>
  );
};
