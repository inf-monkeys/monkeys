import React, { useMemo } from 'react';

import { useParams } from '@tanstack/react-router';

import { MonkeyWorkflow } from '@inf-monkeys/monkeys';
import { CircleHelp, Info, Link, Share2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { useWorkspacePagesWithWorkflowId } from '@/apis/pages';
import { useToggleWorkflowPermission } from '@/apis/workflow';
import { IFrameEmbed } from '@/components/layout-wrapper/workspace/space/sidebar/footer/share/iframe-embed.tsx';
import { EMOJI2LUCIDE_MAPPER } from '@/components/layout-wrapper/workspace/space/sidebar/tabs/tab.tsx';
import { useVinesOriginWorkflow } from '@/components/layout-wrapper/workspace/utils.ts';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label.tsx';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator.tsx';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { VinesLucideIcon } from '@/components/ui/vines-icon/lucide';
import { VINEs_IFRAME_PAGE_TYPE2ID_MAPPER, VINES_IFRAME_PAGE_TYPES } from '@/components/ui/vines-iframe/consts.ts';
import { useCopy } from '@/hooks/use-copy.ts';

interface IShareViewProps extends React.ComponentPropsWithoutRef<'div'> {}

export const ShareView: React.FC<IShareViewProps> = () => {
  const { t } = useTranslation();

  const { workflow, mutateWorkflow, workflowId } = useVinesOriginWorkflow();

  const { trigger } = useToggleWorkflowPermission(workflowId);

  const { data: pages } = useWorkspacePagesWithWorkflowId(workflowId);

  const isUnauthorized = !!workflow?.['notAuthorized'];

  const { teamId, pageId } = useParams({ from: '/$teamId/workspace/$workflowId/$pageId/' });

  const { copy } = useCopy();

  const { workspaceUrl, viewUrls } = useMemo(() => {
    const urlPrefix = window.location.protocol + '//' + window.location.host;
    const workspacePrefix = `${urlPrefix}/${teamId}/workspace/${workflowId}`;

    return {
      workspaceUrl: `${workspacePrefix}/${pageId}`,
      viewUrls: pages?.reduce(
        (acc, { type, id, instance, displayName }) => [
          ...acc,
          {
            displayName,
            icon: EMOJI2LUCIDE_MAPPER[instance?.icon] ?? instance?.icon ?? '🍀',
            iframeUrl: `${workspacePrefix}/${id}/view-iframe`,
            ...(VINES_IFRAME_PAGE_TYPES.includes(type) && {
              viewUrl: `${workspacePrefix}/${VINEs_IFRAME_PAGE_TYPE2ID_MAPPER[type] || `view-${type}`}`,
            }),
          },
        ],
        [] as Record<string, string>[],
      ),
    };
  }, [teamId, workflowId, pageId, pages]);
  return (
    <Popover>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button variant="outline" size="small" icon={<Share2 />} />
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent>{t('workspace.wrapper.settings.common.share-view.title')}</TooltipContent>
      </Tooltip>

      <PopoverContent align="end" side="right" className="w-full min-w-96 space-y-4">
        <div className="flex gap-1">
          <Label>{t('workspace.wrapper.settings.common.share-view.title')}</Label>
          <Tooltip>
            <TooltipTrigger asChild>
              <CircleHelp size={14} className="stroke-gray-10" />
            </TooltipTrigger>
            <TooltipContent>{t('workspace.wrapper.settings.common.share-view.desc')}</TooltipContent>
          </Tooltip>
        </div>

        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Switch
              checked={isUnauthorized}
              onCheckedChange={(checked) => {
                void mutateWorkflow((prev) => ({ ...(prev ?? {}), notAuthorized: checked }) as MonkeyWorkflow, {
                  revalidate: false,
                });

                toast.promise(trigger({ notAuthorized: checked }), {
                  loading: t('workspace.wrapper.settings.common.share-view.loading'),
                  success: t('workspace.wrapper.settings.common.share-view.success'),
                  error: t('workspace.wrapper.settings.common.share-view.error'),
                  finally: () => void mutateWorkflow(),
                });
              }}
              size="small"
            />
            <span className="text-xs">{t('workspace.wrapper.settings.common.share-view.switch')}</span>
          </div>
          {isUnauthorized && (
            <div className="flex items-start space-x-1 rounded-md border border-red-10/50 bg-red-2 p-2">
              <Info size={16} className="w-8 stroke-red-10" />
              <span className="text-xs text-red-10">{t('workspace.wrapper.settings.common.share-view.tips')}</span>
            </div>
          )}
          <Separator className="!my-4" />
          <div className="flex items-center justify-between">
            <div className="flex gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="small" icon={<Link />} onClick={() => copy(workspaceUrl)}>
                    {t('workspace.wrapper.settings.common.share-view.copy-workspace-url.label')}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {t('workspace.wrapper.settings.common.share-view.copy-workspace-url.tips')}
                </TooltipContent>
              </Tooltip>
              {viewUrls?.map(({ icon, displayName, viewUrl, iframeUrl }, i) => (
                <Tooltip key={i}>
                  <TooltipTrigger asChild>
                    <Button
                      className="size-8 !p-0"
                      icon={<VinesLucideIcon className="size-3" size={12} src={icon} />}
                      variant="outline"
                      size="small"
                      onClick={() => copy(viewUrl ?? iframeUrl)}
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    {t('workspace.wrapper.settings.common.share-view.copy-view-url', {
                      name: t([`workspace.wrapper.space.tabs.${displayName}`, displayName]),
                    })}
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
            <IFrameEmbed viewUrls={viewUrls} />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
