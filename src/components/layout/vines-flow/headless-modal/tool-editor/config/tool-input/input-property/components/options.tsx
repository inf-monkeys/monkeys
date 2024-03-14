import React, { useCallback, useMemo } from 'react';

import { BlockDefPropertyOptions } from '@inf-monkeys/vines';
import { isNumber, isString } from 'lodash';

import { IVinesInputPropertyProps } from '@/components/layout/vines-flow/headless-modal/tool-editor/config/tool-input/input-property';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.tsx';

export const OptionsInput: React.FC<IVinesInputPropertyProps> = ({ def, value, onChange, disabled }) => {
  const defaultValue = def.default || void 0;

  const [options, typesMapper] = useMemo(() => {
    const typesMapper: Map<string, string> = new Map();
    const options = (def?.options as BlockDefPropertyOptions[]) ?? [];

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
        <SelectValue placeholder="选择一个选项" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {options.map((option, index) => (
            <SelectItem key={index} value={option.value?.toString() ?? ''}>
              {option.name}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
};
