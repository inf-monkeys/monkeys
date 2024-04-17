import React from 'react';

import { CodeEditor, ICodeEditorProps } from '@/components/ui/code-editor/index.tsx';
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { cn } from '@/utils';

interface ICodePreviewProps
  extends Pick<ICodeEditorProps, 'data' | 'className' | 'options' | 'height' | 'language' | 'lineNumbers' | 'minimap'> {
  children?: React.ReactNode;
}

export const CodePreview: React.FC<ICodePreviewProps> = ({ children, className, ...props }) => {
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogTitle>代码查看</DialogTitle>
        <CodeEditor className={cn('h-96 w-full', className)} {...props} readonly />
      </DialogContent>
    </Dialog>
  );
};
