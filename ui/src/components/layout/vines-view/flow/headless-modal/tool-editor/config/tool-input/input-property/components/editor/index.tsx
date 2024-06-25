import React, { useCallback, useState } from 'react';

import { get, isArray } from 'lodash';
import { useTranslation } from 'react-i18next';

import { IVinesInputPropertyProps } from '@/components/layout/vines-view/flow/headless-modal/tool-editor/config/tool-input/input-property';
import { CodeEditor, ICodeEditorProps } from '@/components/ui/code-editor';

export const EditorInput: React.FC<IVinesInputPropertyProps & Pick<ICodeEditorProps, 'editorRef' | 'onInitial'>> = ({
  def,
  value,
  onChange,
  disabled,
  editorRef,
  onInitial,
}) => {
  const { t } = useTranslation();

  const { type, typeOptions } = def;
  const language = type === 'json' ? 'json' : get(typeOptions, 'editorLanguage', 'plaintext').toLowerCase();
  const isMultipleValues = get(typeOptions, 'multipleValues', false);

  const [error, setError] = useState<string | null>(null);
  const handleOnChange = useCallback(
    (value: unknown) => {
      if (type === 'json') {
        try {
          const toJson = JSON.parse(value as string);
          if (isMultipleValues) {
            if (!isArray(toJson)) {
              setError(t('workspace.flow-view.headless-modal.tool-editor.input.comps.editor.check-json-failed'));
              return;
            }
          }
          onChange?.(toJson);
          setError(null);
        } catch (e) {
          setError(t('workspace.flow-view.headless-modal.tool-editor.input.comps.editor.parse-json-failed'));
        }
      } else {
        onChange?.(value);
      }
    },
    [type, isMultipleValues],
  );

  return (
    <div className="relative h-80">
      {error && (
        <span
          onClick={() => setError(null)}
          className="text-xxs absolute right-6 top-2 z-50 select-none rounded bg-gray-600 bg-opacity-10 p-2 text-danger backdrop-blur-xl transition-opacity hover:opacity-0"
        >
          {error}
        </span>
      )}
      <CodeEditor
        editorRef={editorRef}
        data={value as string}
        height="320px"
        language={language}
        onUpdate={handleOnChange}
        lineNumbers={4}
        readonly={disabled}
        saveWait={650}
        minimap={false}
        onInitial={onInitial}
      />
    </div>
  );
};
