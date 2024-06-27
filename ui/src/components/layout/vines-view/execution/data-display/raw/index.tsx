import React from 'react';

import { FullscreenIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { CodeEditor, ICodeEditorProps } from '@/components/ui/code-editor';
import { CodePreview } from '@/components/ui/code-editor/preview.tsx';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface IExecutionRawDataDisplayProps {
  data: ICodeEditorProps['data'];
  externalStorageDataUrl?: string;
}

export const ExecutionRawDataDisplay: React.FC<IExecutionRawDataDisplayProps> = ({ data, externalStorageDataUrl }) => {
  const { t } = useTranslation();

  return (
    <div className="relative size-full overflow-hidden">
      {externalStorageDataUrl ? (
        <div className="vines-center size-full flex-col gap-2">
          <p className="font-bold">{t('workspace.pre-view.actuator.detail.raw-data-display.label')}</p>
          <Button variant="outline" size="small" onClick={() => open(externalStorageDataUrl, '_blank')}>
            {t('workspace.pre-view.actuator.detail.raw-data-display.open-external-storage')}
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
              <TooltipContent>{t('workspace.pre-view.actuator.detail.raw-data-display.preview')}</TooltipContent>
            </Tooltip>
          </div>
        </>
      )}
    </div>
  );
};
