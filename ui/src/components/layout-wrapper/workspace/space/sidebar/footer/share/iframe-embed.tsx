import React from 'react';

import { useParams } from '@tanstack/react-router';

import { Link } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.tsx';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label.tsx';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator.tsx';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { VinesLucideIcon } from '@/components/ui/vines-icon/lucide';
import { useCopy } from '@/hooks/use-copy.ts';

interface IIFrameEmbedProps {
  viewUrls?: Record<string, string>[];
}

export const IFrameEmbed: React.FC<IIFrameEmbedProps> = ({ viewUrls }) => {
  const { t } = useTranslation();

  const { workflowId, teamId, pageId } = useParams({ from: '/$teamId/workspace/$workflowId/$pageId/' });

  const { copy } = useCopy();

  const urlPrefix = window.location.protocol + '//' + window.location.host;
  const iframeUrl = `${urlPrefix}/${teamId}/workspace/${workflowId}/${pageId}/view-iframe`;

  return (
    <Popover>
      <PopoverTrigger>
        <Button variant="outline" size="small">
          {t('workspace.wrapper.settings.common.iframe.title')}
        </Button>
      </PopoverTrigger>
      <PopoverContent asChild align="end" side="right" alignOffset={-16} sideOffset={20}>
        <Card className="w-full !p-0">
          <CardHeader>
            <CardTitle>{t('workspace.wrapper.settings.common.iframe.title')}</CardTitle>
            <CardDescription>{t('workspace.wrapper.settings.common.iframe.desc')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="space-y-1">
              <Label>{t('workspace.wrapper.settings.common.iframe.built-in.label')}</Label>
              <div className="relative flex items-center justify-end">
                <Input value={iframeUrl} disabled className="pr-24" />
                <Button
                  className="absolute scale-90"
                  variant="outline"
                  size="small"
                  icon={<Link />}
                  onClick={() => copy(iframeUrl)}
                >
                  {t('workspace.wrapper.settings.common.share-view.copy-workspace-url.label')}
                </Button>
              </div>
              <span className="text-xs text-gray-10">
                {t('workspace.wrapper.settings.common.iframe.built-in.tips')}
              </span>
              <Separator className="!my-4" />
              <div className="flex items-center justify-between">
                <Label>{t('workspace.wrapper.settings.common.iframe.other')}</Label>

                <div className="-my-4 flex h-8 gap-1">
                  {viewUrls?.map(({ icon, displayName, iframeUrl }, i) => (
                    <Tooltip key={i}>
                      <TooltipTrigger asChild>
                        <Button
                          className="size-8 !p-0"
                          icon={<VinesLucideIcon className="size-3" size={12} src={icon} />}
                          variant="outline"
                          size="small"
                          onClick={() => copy(iframeUrl)}
                        />
                      </TooltipTrigger>
                      <TooltipContent>
                        {t('workspace.wrapper.settings.common.iframe.copy-other-view', {
                          name: t([`workspace.wrapper.space.tabs.${displayName}`, displayName]),
                        })}
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  );
};
