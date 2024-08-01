import React from 'react';

import { ExternalLink } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { JSONValue } from '@/components/ui/code-editor';
import { Label } from '@/components/ui/label.tsx';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface IVinesAbstractUrlProps {
  children: JSONValue;
}

export const VinesAbstractUrl: React.FC<IVinesAbstractUrlProps> = ({ children }) => {
  const { t } = useTranslation();

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className="flex items-center gap-1 underline hover:decoration-2 [&>*]:cursor-pointer"
          onClick={() => open(children?.toString(), '_blank')}
        >
          <ExternalLink size={14} className="-mb-1" />
          <Label>{children?.toString()}</Label>
        </div>
      </TooltipTrigger>
      <TooltipContent>{t('workspace.pre-view.actuator.detail.abstract-data-preview.url')}</TooltipContent>
    </Tooltip>
  );
};
