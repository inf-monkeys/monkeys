import React, { useEffect, useMemo } from 'react';

import { VariableEditorProps } from '@/components/ui/vines-variable-editor/index.tsx';
import { useVariableEditor } from '@/components/ui/vines-variable-editor/use-editor.tsx';

const VariableEditor: React.FC<VariableEditorProps> = ({ editorRef, ...rest }) => {
  const { VariableEditor: Editor, insertVariable, onChange } = useVariableEditor(rest);

  useEffect(() => {
    if (editorRef?.current) {
      editorRef.current.insertVariable = insertVariable;
      editorRef.current.onChange = onChange;
    }
  }, [editorRef]);

  return useMemo(() => <Editor placeholder={rest.placeholder} />, []);
};

export default VariableEditor;
