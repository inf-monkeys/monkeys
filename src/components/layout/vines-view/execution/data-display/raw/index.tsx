import React from 'react';

import { FullscreenIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { CodeEditor, ICodeEditorProps } from '@/components/ui/code-editor';
import { CodePreview } from '@/components/ui/code-editor/preview.tsx';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface IExecutionRawDataDisplayProps {
  data: ICodeEditorProps['data'];
  externalStorageDataUrl?: string;
}

export const ExecutionRawDataDisplay: React.FC<IExecutionRawDataDisplayProps> = ({ data, externalStorageDataUrl }) => {
  return (
    <div className="relative size-full overflow-clip">
      {externalStorageDataUrl ? (
        <div className="vines-center size-full flex-col gap-2">
          <p className="font-bold">内容过大，请到 OSS 下载查看</p>
          <Button variant="outline" size="small" onClick={() => open(externalStorageDataUrl, '_blank')}>
            点击查看
          </Button>
        </div>
      ) : (
        <>
          <CodeEditor data={data} readonly lineNumbers={3} />
          <div className="absolute bottom-1 right-1">
            <Tooltip>
              <CodePreview data={data} lineNumbers={3} minimap>
                <TooltipTrigger asChild>
                  <Button icon={<FullscreenIcon />} variant="outline" size="small" className="scale-80" />
                </TooltipTrigger>
              </CodePreview>
              <TooltipContent>放大查看代码</TooltipContent>
            </Tooltip>
          </div>
        </>
      )}
    </div>
  );
};
