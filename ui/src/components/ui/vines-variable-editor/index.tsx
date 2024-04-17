import React, { useEffect, useMemo } from 'react';

import { useVariableEditor, UseVariableEditorOptions } from '@/components/ui/vines-variable-editor/use-editor.tsx';

export type VariableEditorRefProps = {
  insertVariable: (pointer: string) => void;
  onChange?: (text: string) => void;
};

export type VariableEditorProps = {
  placeholder?: string;
  editorRef?: React.MutableRefObject<VariableEditorRefProps>;
} & UseVariableEditorOptions;

export const VariableEditor: React.FC<VariableEditorProps> = ({ editorRef, ...rest }) => {
  const { VariableEditor: Editor, insertVariable, onChange } = useVariableEditor(rest);

  useEffect(() => {
    if (editorRef?.current) {
      editorRef.current.insertVariable = insertVariable;
      editorRef.current.onChange = onChange;
    }
  }, [editorRef]);

  return useMemo(() => <Editor placeholder={rest.placeholder} />, []);
};
