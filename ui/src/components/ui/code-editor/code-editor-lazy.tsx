import React, { useCallback, useMemo, useRef } from 'react';

import MonacoEditor, { EditorProps, loader, OnMount } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker';
import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker';
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker';
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker';

self.MonacoEnvironment = {
  getWorker(_, label) {
    if (label === 'json') {
      return new jsonWorker();
    }
    if (label === 'css' || label === 'scss' || label === 'less') {
      return new cssWorker();
    }
    if (label === 'html' || label === 'handlebars' || label === 'razor') {
      return new htmlWorker();
    }
    if (label === 'typescript' || label === 'javascript') {
      return new tsWorker();
    }
    return new editorWorker();
  },
};

loader.config({ monaco });

import { debounce, merge } from 'lodash';
import { IRange } from 'monaco-editor';

import type { ICodeEditorProps } from '@/components/ui/code-editor/index.tsx';
import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/utils';
import { stringify } from '@/utils/fast-stable-stringify.ts';

const DEFAULT_OPTIONS: EditorProps['options'] = {
  wordWrap: 'on',
  automaticLayout: true,
};

const READONLY_OPTIONS: EditorProps['options'] = {
  lineDecorationsWidth: 0,
  lineNumbersMinChars: 3,
  minimap: {
    enabled: false,
  },
};

const CodeEditorCore: React.FC<ICodeEditorProps> = ({
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
  editorRef,
  onInitial,
}) => {
  const darkMode = useAppStore((s) => s.darkMode);

  const saveInput = useCallback(
    debounce((input: string) => onUpdate && onUpdate(input), saveWait),
    [onUpdate, saveWait],
  );

  const useRealtimeData = useRef(true);
  const handleEditorDidMount: OnMount = useCallback(
    (editor) => {
      editor.onDidChangeModelContent(() => {
        useRealtimeData.current = false;
        saveInput(editor.getValue());
      });

      editor.onDidBlurEditorWidget(() => {
        useRealtimeData.current = true;
      });

      if (editorRef?.current) {
        editorRef.current.insertText = (text: string) => {
          const selection = editor.getSelection();

          editor.executeEdits('my-source', [
            {
              range: selection as unknown as IRange,
              text: text,
              forceMoveMarkers: true,
            },
          ]);
        };
      }

      readonly &&
        editor.updateOptions({
          readOnly: true,
        });

      onInitial?.();
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
      language={language}
      defaultLanguage={language}
      value={useRealtimeData.current ? finalData : void 0}
      height={height}
      className={cn(
        'size-full',
        !hideBorder && 'overflow-hidden rounded border border-solid border-white border-opacity-20 shadow',
        className,
      )}
      options={finalOptions}
      theme={darkMode ? 'vs-dark' : 'light'}
      onMount={handleEditorDidMount}
    />
  );
};

export default CodeEditorCore;
