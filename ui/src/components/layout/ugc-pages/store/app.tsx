import React, { useState } from 'react';

import { useMemoizedFn } from 'ahooks';
import { Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { deleteApplicationOnStore, forkApplicationFromTemplate } from '@/apis/application-store';
import { IApplicationStoreItemDetail } from '@/apis/ugc/asset-typings.ts';
import { useVinesTeam } from '@/components/router/guard/team.tsx';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog.tsx';
import { Button } from '@/components/ui/button';
import { VinesImage } from '@/components/ui/image';
import { VinesMarkdown } from '@/components/ui/markdown';
import { ScrollArea } from '@/components/ui/scroll-area.tsx';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { VinesIcon } from '@/components/ui/vines-icon';
import { getI18nContent } from '@/utils';
import VinesEvent from '@/utils/events.ts';

interface IStoreAppProps extends IApplicationStoreItemDetail {
  mutate: () => void;
}

export const StoreApp: React.FC<IStoreAppProps> = ({
  id,
  iconUrl,
  displayName,
  description,
  teamId: itTeamId,
  mutate,
}) => {
  const { t } = useTranslation();

  const { teamId } = useVinesTeam();

  const [isLoading, setIsLoading] = useState(false);

  const handleDeleteApplicationOnStore = useMemoizedFn((id: string) => {
    return toast.promise(deleteApplicationOnStore(id, 'workflow'), {
      loading: t('common.delete.loading'),
      success: () => {
        void mutate();
        return t('common.delete.success');
      },
      error: t('common.delete.error'),
    });
  });

  const handleUse = useMemoizedFn(async () => {
    setIsLoading(true);

    toast.promise(
      forkApplicationFromTemplate(id, [
        {
          default: 'preview',
        },
      ]),
      {
        success: (flow) => {
          if (flow) {
            setTimeout(
              () => VinesEvent.emit('vines-nav', '/$teamId', { teamId }, { activePage: flow.workflowId }),
              100,
            );
          }
          setIsLoading(false);
          return t('components.layout.ugc.import-dialog.use-template.success');
        },
        error: () => {
          setIsLoading(false);
          return t('components.layout.ugc.import-dialog.use-template.error');
        },
        loading: t('components.layout.ugc.import-dialog.use-template.loading'),
      },
    );
  });

  const isEmojiIcon = iconUrl.startsWith('emoji:');
  const title = getI18nContent(displayName);
  const desc = getI18nContent(description);

  return (
    <div key={id} className="relative m-2 h-80 w-[calc(100%-1rem)] rounded-md border border-input shadow-sm">
      <div className="m-3 mb-0 h-1/2 overflow-hidden rounded-t-md">
        {isEmojiIcon ? (
          <VinesIcon src={iconUrl} className="[&_img]:!size-12" />
        ) : (
          <VinesImage src={iconUrl} alt={title} className="w-full object-cover" disabled />
        )}
      </div>
      <div className="absolute bottom-0 flex h-1/2 w-full flex-col justify-between gap-1 overflow-hidden rounded-b-md bg-slate-1/35 p-4 backdrop-blur-md">
        <h1 className="text-base font-bold">{title}</h1>
        <ScrollArea disabledOverflowMask>
          <VinesMarkdown className="min-h-[55px] flex-1 text-sm">{desc}</VinesMarkdown>
        </ScrollArea>
        <div className="flex h-10 w-full items-center gap-2">
          <Button className="w-full" variant="outline" onClick={handleUse} loading={isLoading}>
            {t('components.layout.ugc.import-dialog.import-to-team')}
          </Button>
          {teamId === itTeamId && (
            <AlertDialog>
              <Tooltip>
                <AlertDialogTrigger asChild>
                  <TooltipTrigger asChild>
                    <Button size="small" className="[&>div>svg]:stroke-red-10" icon={<Trash2 />} variant="outline" />
                  </TooltipTrigger>
                </AlertDialogTrigger>
                <TooltipContent>{t('components.layout.ugc.import-dialog.delete.label')}</TooltipContent>
              </Tooltip>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t('components.layout.ugc.import-dialog.delete.label')}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {t('components.layout.ugc.import-dialog.delete.desc')}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t('common.utils.cancel')}</AlertDialogCancel>
                  <AlertDialogAction onClick={() => handleDeleteApplicationOnStore(id)}>
                    {t('common.utils.confirm')}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>
    </div>
  );
};
