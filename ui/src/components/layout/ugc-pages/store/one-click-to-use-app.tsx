import React, { useState } from 'react';

import { useMemoizedFn } from 'ahooks';
import { AnimatePresence, motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { createShortcutsFlowWithWorkflowId, forkApplicationFromTemplate } from '@/apis/application-store';
import { IApplicationStoreItemDetail } from '@/apis/ugc/asset-typings.ts';
import { useAppChecklist } from '@/components/layout/ugc-pages/store/use-app-checklist.ts';
import { useVinesTeam } from '@/components/router/guard/team.tsx';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { VinesImage } from '@/components/ui/image';
import { Label } from '@/components/ui/label.tsx';
import { VinesLoading } from '@/components/ui/loading';
import { VinesIcon } from '@/components/ui/vines-icon';
import { getI18nContent } from '@/utils';
import VinesEvent from '@/utils/events.ts';

interface IOneClickToUseAppProps extends IApplicationStoreItemDetail {
  id: string;
  children: React.ReactNode;
}

export const OneClickToUseApp: React.FC<IOneClickToUseAppProps> = ({ id, children, ...workflow }) => {
  const { forkFromId, thumbnail, iconUrl, displayName, description, exposeOpenaiCompatibleInterface } = workflow;

  const { t, i18n } = useTranslation();

  const { teamId } = useVinesTeam();

  const [open, setOpen] = useState(false);
  const [isOnlyImportLoading, setIsOnlyImportLoading] = useState(false);

  const handleOnlyImport = useMemoizedFn(async () => {
    setIsOnlyImportLoading(true);

    toast.promise(
      forkApplicationFromTemplate(id, [
        {
          default: exposeOpenaiCompatibleInterface ? 'chat' : 'preview',
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
          setIsOnlyImportLoading(false);
          setOpen(false);
          return t('components.layout.ugc.import-dialog.use-template.success');
        },
        error: () => {
          setIsOnlyImportLoading(false);
          return t('components.layout.ugc.import-dialog.use-template.error');
        },
        loading: t('components.layout.ugc.import-dialog.use-template.loading'),
      },
    );
  });

  const [isLoading, setIsLoading] = useState(false);
  const handleUse = useMemoizedFn(async () => {
    if (!forkFromId) {
      toast.error(t('components.layout.ugc.import-dialog.only-import.error'));
      return;
    }
    setIsLoading(true);
    toast.promise(createShortcutsFlowWithWorkflowId(forkFromId), {
      success: (flow) => {
        if (flow) {
          setTimeout(() => VinesEvent.emit('vines-nav', '/$teamId', { teamId }, { activePage: flow.workflowId }), 100);
        }
        setIsLoading(false);
        setOpen(false);
        return t('components.layout.ugc.import-dialog.only-import.success');
      },
      error: () => {
        setIsLoading(false);
        return t('components.layout.ugc.import-dialog.only-import.error');
      },
      loading: t('components.layout.ugc.import-dialog.only-import.loading'),
    });
  });

  const {
    pinnedViews,
    unpinnedViews,
    isLoading: isChecklistLoading,
    addedTools,
    pendingTools,
  } = useAppChecklist(open, workflow);
  const addedToolsCount = addedTools.length;
  const pendingToolsCount = pendingTools.length;

  const isEmojiIcon = iconUrl.startsWith('emoji:');
  const isThumbnailValid = thumbnail?.startsWith('http');
  const title = getI18nContent(displayName);
  const desc = getI18nContent(description);

  const en = i18n.language === 'en';

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-[40rem] gap-0">
        <div>
          <div className="relative h-20 w-full overflow-hidden rounded-md">
            <div className="vines-center absolute left-0 top-0 z-0 h-20 w-full scale-125 bg-muted">
              {isThumbnailValid && thumbnail ? (
                <VinesImage src={thumbnail} alt={title} className="w-full object-cover" disabled />
              ) : isEmojiIcon ? (
                <VinesIcon src={iconUrl} className="[&_img]:!size-12" />
              ) : (
                <VinesImage src={iconUrl} alt={title} className="w-full object-cover" disabled />
              )}
            </div>
            <div className="absolute z-10 flex size-full flex-col justify-center gap-1 bg-black/10 px-6 backdrop-blur">
              <h1 className="line-clamp-1 text-base font-bold text-white">{title}</h1>
              {desc && <p className="line-clamp-1 text-xs text-white/90">{desc}</p>}
            </div>
          </div>
          <AnimatePresence>
            {isChecklistLoading ? (
              <VinesLoading className="vines-center h-52 w-full" immediately />
            ) : (
              <motion.div
                className="space-y-6 p-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="space-y-3">
                  <Label>{t('components.layout.ugc.import-dialog.import-to-team.views.label')}</Label>
                  <div className="text-sm">
                    <p>
                      {t('components.layout.ugc.import-dialog.import-to-team.views.pinned', {
                        count: pinnedViews.length,
                        items: pinnedViews.join(en ? ',' : '、'),
                      })}
                    </p>
                    <p>
                      {t('components.layout.ugc.import-dialog.import-to-team.views.unpinned', {
                        count: unpinnedViews.length,
                        items: unpinnedViews.join(en ? ',' : '、'),
                      })}
                    </p>
                  </div>
                </div>
                <div className="space-y-3">
                  <Label>{t('components.layout.ugc.import-dialog.import-to-team.tools.label')}</Label>
                  <div className="text-sm">
                    {addedToolsCount > 0 && (
                      <p>
                        {t('components.layout.ugc.import-dialog.import-to-team.tools.added', {
                          count: addedToolsCount,
                          items: addedTools.join(en ? ',' : '、'),
                        })}
                      </p>
                    )}
                    {pendingToolsCount > 0 && (
                      <p>
                        {t('components.layout.ugc.import-dialog.import-to-team.tools.pending', {
                          count: pendingToolsCount,
                          items: pendingTools.join(en ? ',' : '、'),
                        })}
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <DialogFooter>
          <Button onClick={() => setOpen(false)} variant="outline">
            {t('common.utils.cancel')}
          </Button>
          <Button
            className="hidden"
            disabled
            variant="outline"
            onClick={handleOnlyImport}
            loading={isOnlyImportLoading}
          >
            {t('components.layout.ugc.import-dialog.only-import.label')}
          </Button>
          <Button variant="solid" onClick={handleUse} loading={isLoading}>
            {t('components.layout.ugc.import-dialog.import-to-team.label')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
