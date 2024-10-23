import React, { lazy, Suspense } from 'react';

import type { EditorProps } from '@monaco-editor/react';

import { Skeleton } from '@/components/ui/skeleton.tsx';

export type JSONValue = null | string | number | boolean | { [x: string]: JSONValue } | Array<JSONValue>;

export interface IVinesEditorRefProps {
  insertText: (text: string) => void;
}

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

  editorRef?: React.MutableRefObject<IVinesEditorRefProps>;
  onInitial?: () => void;
}

const CodeEditorCore = lazy(() => import('./core.tsx'));

export const CodeEditor: React.FC<ICodeEditorProps> = (props) => (
  <Suspense fallback={<Skeleton className="size-full min-h-60" />}>
    <CodeEditorCore {...props} />
  </Suspense>
);
