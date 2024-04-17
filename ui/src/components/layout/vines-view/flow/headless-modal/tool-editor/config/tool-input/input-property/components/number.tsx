import React, { useCallback } from 'react';

import { get, isNumber, toNumber } from 'lodash';

import { IVinesInputPropertyProps } from '@/components/layout/vines-view/flow/headless-modal/tool-editor/config/tool-input/input-property';
import { StringInput } from '@/components/layout/vines-view/flow/headless-modal/tool-editor/config/tool-input/input-property/components/string.tsx';

export const NumberInput: React.FC<IVinesInputPropertyProps> = ({ def, value, onChange, ...props }) => {
  const minValue = get(def, 'typeOptions.minValue', void 0);
  const maxValue = get(def, 'typeOptions.maxValue', void 0);

  const handleOnChange = useCallback(
    (value: unknown) => {
      let numberValue = toNumber(value);

      // 可能有变量，不校验
      if (!isNumber(numberValue) || isNaN(numberValue)) {
        onChange?.(value);
        return;
      }

      void (minValue !== void 0 && numberValue < minValue && (numberValue = minValue));
      void (maxValue !== void 0 && numberValue > maxValue && (numberValue = maxValue));

      onChange?.(numberValue);
    },
    [minValue, maxValue, onChange],
  );
  return <StringInput value={value?.toString() ?? def.default ?? ''} onChange={handleOnChange} def={def} {...props} />;
};
