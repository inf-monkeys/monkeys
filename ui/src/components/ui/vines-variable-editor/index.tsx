import React, { lazy, Suspense } from 'react';

import { Skeleton } from '@/components/ui/skeleton.tsx';
import { UseVariableEditorOptions } from '@/components/ui/vines-variable-editor/use-editor.tsx';

export type VariableEditorRefProps = {
  insertVariable: (pointer: string) => void;
  onChange?: (text: string) => void;
};

export type VariableEditorProps = {
  placeholder?: string;
  editorRef?: React.MutableRefObject<VariableEditorRefProps>;
} & UseVariableEditorOptions;

const VariableEditorCore = lazy(() => import('./vines-variable-editor-lazy.tsx'));

export const VariableEditor: React.FC<VariableEditorProps> = (props) => (
  <Suspense fallback={<Skeleton className="min-h-10 w-full" />}>
    <VariableEditorCore {...props} />
  </Suspense>
);
