import React, { useMemo } from 'react';

import { get, isArray } from 'lodash';
import { useTranslation } from 'react-i18next';

import { IVinesInputPropertyProps } from '@/components/layout/workspace/vines-view/flow/headless-modal/tool-editor/config/tool-input/input-property';
import { MultiSelect, MultiSelectProps } from '@/components/ui/multi-select';
import { getI18nContent } from '@/utils';

export const CollectionInput: React.FC<
  IVinesInputPropertyProps &
    Omit<MultiSelectProps, 'options' | 'onValueChange' | 'value'> & {
      options?: MultiSelectProps['options'];
    }
> = ({ def, value, onChange, disabled, options = [], ...attr }) => {
  const { t } = useTranslation();

  const type = get(def, 'type', 'string');

  const valueArray = useMemo(
    () =>
      (isArray(value) ? (value as string[]) : value?.toString()?.split(','))
        ?.map((it) => it?.toString())
        ?.filter((it) => it)
        ?.filter((it) =>
          type === 'number' ? !isNaN(Number(it)) : type === 'boolean' ? ['true', 'false'].includes(it) : it,
        ),
    [value],
  );

  const placeholder = getI18nContent(def?.placeholder);

  return (
    <MultiSelect
      value={valueArray}
      onValueChange={(value) =>
        onChange?.(
          type === 'number'
            ? value.map((it) => Number(it)).filter((it) => it)
            : type === 'boolean'
              ? value.filter((it) => ['true', 'false'].includes(it)).map((it) => it === 'true')
              : value.filter((it) => it),
        )
      }
      disabled={disabled}
      options={options}
      placeholder={
        placeholder
          ? placeholder
          : t('workspace.flow-view.headless-modal.tool-editor.input.comps.collection.placeholder', {
              name: getI18nContent(def.displayName),
            })
      }
      {...attr}
    />
  );
};
