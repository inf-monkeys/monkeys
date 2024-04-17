import React, { useCallback, useState } from 'react';

import { get, isArray } from 'lodash';

import { IVinesInputPropertyProps } from '@/components/layout/vines-view/flow/headless-modal/tool-editor/config/tool-input/input-property';
import { CodeEditor } from '@/components/ui/code-editor';

export const EditorInput: React.FC<IVinesInputPropertyProps> = ({ def, value, onChange, disabled }) => {
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
              setError('必须为 JSON 数组');
              return;
            }
          }
          onChange?.(toJson);
          setError(null);
        } catch (e) {
          setError('JSON 解析失败！数据将不会保存，请检查');
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
        data={value as string}
        height="320px"
        language={language}
        onUpdate={handleOnChange}
        lineNumbers={4}
        readonly={disabled}
        saveWait={650}
        minimap={false}
      />
    </div>
  );
};
