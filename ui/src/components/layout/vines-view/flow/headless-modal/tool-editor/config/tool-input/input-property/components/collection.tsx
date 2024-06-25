import React from 'react';

import { get } from 'lodash';
import { useTranslation } from 'react-i18next';

import { IVinesInputPropertyProps } from '@/components/layout/vines-view/flow/headless-modal/tool-editor/config/tool-input/input-property';
import { TagInput } from '@/components/ui/input/tag';

export const CollectionInput: React.FC<IVinesInputPropertyProps> = ({ def, value, onChange, disabled }) => {
  const { t } = useTranslation();

  const type = get(def, 'type', 'string');

  return (
    <TagInput
      placeholder={
        def?.placeholder
          ? t('workspace.flow-view.headless-modal.tool-editor.input.comps.collection.placeholder', {
              name: def.placeholder,
            })
          : t('workspace.flow-view.headless-modal.tool-editor.input.comps.collection.placeholder-name', {
              name: def.displayName,
            })
      }
      value={(!Array.isArray(value) ? value?.toString()?.split(',') : (value as string[]))
        ?.map((it) => it?.toString())
        ?.filter((it) => it)
        ?.filter((it) =>
          type === 'number' ? !isNaN(Number(it)) : type === 'boolean' ? ['true', 'false'].includes(it) : it,
        )}
      onChange={(value) =>
        onChange?.(
          type === 'number'
            ? value.map((it) => Number(it)).filter((it) => it)
            : type === 'boolean'
              ? value.filter((it) => ['true', 'false'].includes(it)).map((it) => it === 'true')
              : value.filter((it) => it),
        )
      }
      disabled={disabled}
    />
  );
};
