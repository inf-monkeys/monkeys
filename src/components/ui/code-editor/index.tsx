import React, { useCallback, useMemo } from 'react';

import MonacoEditor, { EditorProps, OnMount } from '@monaco-editor/react';
import _ from 'lodash';

import { cn } from '@/utils';

interface ICodeEditorProps {
  data: string | Record<string, unknown> | Array<unknown>;
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
  theme?: 'vs-dark' | 'light';
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
  theme,
}) => {
  const saveInput = useCallback(
    _.debounce((input: string) => onUpdate && onUpdate(input), saveWait),
    [onUpdate, saveWait],
  );

  const handleEditorDidMount: OnMount = useCallback(
    (editor) => {
      editor.onDidChangeModelContent(() => {
        saveInput(editor.getValue());
      });
      void (
        readonly &&
        editor.updateOptions({
          readOnly: true,
        })
      );
    },
    [readonly],
  );

  const finalOptions = useMemo(
    () =>
      _.merge(
        {},
        DEFAULT_OPTIONS,
        readonly ? READONLY_OPTIONS : {},
        lineNumbers ? { lineNumbersMinChars: lineNumbers, lineNumbers: 'on' } : { lineNumbers: 'off' },
        typeof minimap !== 'undefined' ? { minimap: { enabled: minimap } } : {},
        options,
      ),
    [options, readonly, lineNumbers],
  );

  const finalData = useMemo(() => (typeof data === 'string' ? data : JSON.stringify(data, null, 2)), [data]);

  return (
    <MonacoEditor
      defaultLanguage={language}
      value={finalData}
      height={height}
      className={cn(
        'h-full w-full',
        {
          'overflow-clip rounded border border-solid border-white border-opacity-20 shadow': !hideBorder,
        },
        className,
      )}
      options={finalOptions}
      theme={
        theme
          ? theme
          : document.documentElement.getAttribute('data-mantine-color-scheme') === 'dark'
            ? 'vs-dark'
            : 'light'
      }
      onMount={handleEditorDidMount}
    />
  );
};
