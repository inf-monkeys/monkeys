import React, { useCallback, useMemo } from 'react';

import { ToolPropertyOptions } from '@inf-monkeys/monkeys';
import { isNumber, isString } from 'lodash';
import { useTranslation } from 'react-i18next';

import { IVinesInputPropertyProps } from '@/components/layout/vines-view/flow/headless-modal/tool-editor/config/tool-input/input-property';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.tsx';
import { getI18nContent } from '@/utils';

export const OptionsInput: React.FC<IVinesInputPropertyProps> = ({ def, value, onChange, disabled }) => {
  const { t } = useTranslation();

  const defaultValue = def.default || void 0;

  const [options, typesMapper] = useMemo(() => {
    const typesMapper: Map<string, string> = new Map();
    const options = (def?.options as ToolPropertyOptions[]) ?? [];

    options.forEach((option) => {
      typesMapper.set(option.value?.toString(), typeof option.value);
    });

    return [options.map((it) => ({ ...it, value: it.value?.toString() })), typesMapper];
  }, [def?.options]);

  const handleOnChange = useCallback(
    (value: unknown) =>
      onChange?.(
        typesMapper.get(value as string) === 'number'
          ? Number(value)
          : typesMapper.get(value as string) === 'boolean'
            ? value === 'true'
            : value,
      ),
    [typesMapper],
  );

  return (
    <Select
      defaultValue={isString(defaultValue) || isNumber(defaultValue) ? defaultValue.toString() : void 0}
      onValueChange={handleOnChange}
      value={value?.toString() ?? ''}
      disabled={disabled}
    >
      <SelectTrigger>
        <SelectValue
          placeholder={t('workspace.flow-view.headless-modal.tool-editor.input.comps.options.placeholder')}
        />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {options.map((option, index) => (
            <SelectItem key={index} value={option.value?.toString() ?? ''}>
              {getI18nContent(option.name) ?? t('common.utils.unknown')}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
};
