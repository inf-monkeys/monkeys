import React from 'react';

import { Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { IVinesInputPropertyProps } from '@/components/layout/workspace/vines-view/flow/headless-modal/tool-editor/config/tool-input/input-property';
import { Input } from '@/components/ui/input';
import { TagInput } from '@/components/ui/input/tag';
import { getI18nContent } from '@/utils';

export const BlankInput: React.FC<IVinesInputPropertyProps> = ({ def, value, onChange, disabled }) => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-2">
      {Array.isArray(value) ? (
        <TagInput
          placeholder={
            getI18nContent(def?.placeholder)
              ? t('workspace.flow-view.headless-modal.tool-editor.input.comps.collection.placeholder', {
                  name: getI18nContent(def.placeholder),
                })
              : t('workspace.flow-view.headless-modal.tool-editor.input.comps.collection.placeholder-name', {
                  name: getI18nContent(def.displayName),
                })
          }
          value={typeof value !== 'object' ? (value as unknown)?.toString()?.split(',') : (value as string[])}
          onChange={onChange}
          disabled={disabled}
        />
      ) : (
        <Input value={value as string} onChange={onChange} disabled={disabled} />
      )}
      <div className="flex items-center gap-2 rounded bg-gray-600 bg-opacity-20 px-2 py-1 shadow-sm">
        <Info size={14} />
        <span className="text-xs">{t('workspace.flow-view.headless-modal.tool-editor.input.comps.blank.tips')}</span>
      </div>
    </div>
  );
};
