import React from 'react';

import { useParams } from '@tanstack/react-router';

import { Copy } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.tsx';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label.tsx';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useCopy } from '@/hooks/use-copy.ts';

interface IIFrameEmbedProps extends React.ComponentPropsWithoutRef<'div'> {}

export const IFrameEmbed: React.FC<IIFrameEmbedProps> = () => {
  const { t } = useTranslation();

  const { workflowId, teamId, pageId } = useParams({ from: '/$teamId/workspace/$workflowId/$pageId/' });

  const { copy } = useCopy();

  const urlPrefix = window.location.protocol + '//' + window.location.host;
  const iframeUrl = `${urlPrefix}/${teamId}/workspace/${workflowId}/${pageId}/view-iframe`;
  const builtinUrl = `${urlPrefix}/${teamId}/workspace/${workflowId}/view-flow`;

  return (
    <Popover>
      <PopoverTrigger>
        <Button variant="outline" size="small">
          {t('workspace.wrapper.settings.common.iframe.title')}
        </Button>
      </PopoverTrigger>
      <PopoverContent asChild align="end" side="right" alignOffset={-16} sideOffset={20}>
        <Card className="w-[32rem] !p-0">
          <CardHeader>
            <CardTitle>{t('workspace.wrapper.settings.common.iframe.title')}</CardTitle>
            <CardDescription>{t('workspace.wrapper.settings.common.iframe.desc')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="space-y-1">
              <Label>{t('workspace.wrapper.settings.common.iframe.built-in.label')}</Label>
              <p className="text-xs text-gray-11">{t('workspace.wrapper.settings.common.iframe.built-in.desc1')}</p>
              <p className="text-xs text-gray-11">{t('workspace.wrapper.settings.common.iframe.built-in.desc2')}</p>
              <div className="relative flex items-center justify-end">
                <Input value={builtinUrl} disabled />
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      icon={<Copy />}
                      size="small"
                      variant="outline"
                      className="absolute top-0 mr-0.5 mt-0.5 scale-75"
                      onClick={() => copy(builtinUrl)}
                    />
                  </TooltipTrigger>
                  <TooltipContent>{t('common.utils.copy')}</TooltipContent>
                </Tooltip>
              </div>
              <span className="text-xs text-gray-10">
                {t('workspace.wrapper.settings.common.iframe.built-in.tips')}
              </span>
            </div>
            <div className="hidden space-y-1">
              <Label>iframe 嵌入地址</Label>
              <div className="relative flex items-center justify-end">
                <Input value={iframeUrl} disabled />
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      icon={<Copy />}
                      size="small"
                      variant="outline"
                      className="absolute top-0 mr-0.5 mt-0.5 scale-75"
                      onClick={() => copy(iframeUrl)}
                    />
                  </TooltipTrigger>
                  <TooltipContent>{t('common.utils.copy')}</TooltipContent>
                </Tooltip>
              </div>
              <span className="text-xs text-gray-10">
                地址结构为：https://[domain]/[团队 ID]/workspace/[工作流 ID]/[视图 ID]/view-iframe
              </span>
            </div>
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  );
};