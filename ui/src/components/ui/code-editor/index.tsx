import React, { useCallback, useMemo } from 'react';

import MonacoEditor, { EditorProps, OnMount } from '@monaco-editor/react';
import { debounce, merge } from 'lodash';

import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/utils';
import { stringify } from '@/utils/fast-stable-stringify.ts';

export type JSONValue = null | string | number | boolean | { [x: string]: JSONValue } | Array<JSONValue>;

export interface ICodeEditorProps {
  data: JSONValue;
  onUpdate?: (rawData: string) => void;
  className?: string;
  options?: EditorProps['options'];
  height?: number | string;
  language?: string;
  readonly?: boolean;
  lineNumbers?: number;
  minimap?: boolean;
  hideBorder?: boolean;
  saveWait?: number;
}

const DEFAULT_OPTIONS: EditorProps['options'] = {
  wordWrap: 'on',
};

const READONLY_OPTIONS: EditorProps['options'] = {
  lineDecorationsWidth: 0,
  lineNumbersMinChars: 3,
  minimap: {
    enabled: false,
  },
};

export const CodeEditor: React.FC<ICodeEditorProps> = ({
  language = 'json',
  minimap,
  readonly = false,
  hideBorder = false,
  lineNumbers,
  data,
  height,
  onUpdate,
  className,
  options,
  saveWait = 200,
}) => {
  const { darkMode } = useAppStore();

  const saveInput = useCallback(
    debounce((input: string) => onUpdate && onUpdate(input), saveWait),
    [onUpdate, saveWait],
  );

  const handleEditorDidMount: OnMount = useCallback(
    (editor) => {
      editor.onDidChangeModelContent(() => {
        saveInput(editor.getValue());
      });

      readonly &&
        editor.updateOptions({
          readOnly: true,
        });
    },
    [readonly],
  );

  const finalOptions = useMemo(
    () =>
      merge(
        {},
        DEFAULT_OPTIONS,
        readonly ? READONLY_OPTIONS : {},
        lineNumbers ? { lineNumbersMinChars: lineNumbers, lineNumbers: 'on' } : { lineNumbers: 'off' },
        typeof minimap !== 'undefined' ? { minimap: { enabled: minimap } } : {},
        options,
      ),
    [options, readonly, lineNumbers],
  );

  const finalData = useMemo(() => (typeof data === 'string' ? data : JSON.stringify(data, null, 2)), [stringify(data)]);

  return (
    <MonacoEditor
      defaultLanguage={language}
      value={finalData}
      height={height}
      className={cn(
        'h-full w-full',
        !hideBorder && 'overflow-clip rounded border border-solid border-white border-opacity-20 shadow',
        className,
      )}
      options={finalOptions}
      theme={darkMode ? 'vs-dark' : 'light'}
      onMount={handleEditorDidMount}
    />
  );
};
