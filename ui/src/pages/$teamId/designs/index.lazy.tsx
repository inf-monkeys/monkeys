import React, { useState } from 'react';

import { mutate } from 'swr';
import { createLazyFileRoute, useNavigate } from '@tanstack/react-router';

import { Link, Pencil, Trash } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { deleteDesignProject } from '@/apis/designs';
import { IDesignProject } from '@/apis/designs/typings.ts';
import { preloadUgcDesignProjects, useUgcDesignProjects } from '@/apis/ugc';
import { IAssetItem } from '@/apis/ugc/typings.ts';
import { DesignProjectInfoEditor } from '@/components/layout/design-space/design-project-info-editor.tsx';
import { UgcView } from '@/components/layout/ugc/view';
import { RenderIcon } from '@/components/layout/ugc/view/utils/renderer.tsx';
import { createDesignProjectsColumns } from '@/components/layout/ugc-pages/design-project/consts.tsx';
import { CreateDesignProjectDialog } from '@/components/layout/ugc-pages/design-project/create';
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
} from '@/components/ui/alert-dialog.tsx';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu.tsx';
import { Tooltip, TooltipTrigger } from '@/components/ui/tooltip';
import { useCopy } from '@/hooks/use-copy.ts';
import { getI18nContent } from '@/utils';
import { formatTimeDiffPrevious } from '@/utils/time.ts';

export const Designs: React.FC = () => {
  const { t } = useTranslation();

  const navigate = useNavigate();
  const { copy } = useCopy({ timeout: 500 });
  const { teamId } = useVinesTeam();
  const mutateDesignProjects = () => mutate((key) => typeof key === 'string' && key.startsWith('/api/design/project'));

  const [currentDesignProject, setCurrentDesignProject] = useState<IAssetItem<IDesignProject>>();
  const [designProjectEditorVisible, setDesignProjectEditorVisible] = useState(false);
  const [deleteAlertDialogVisible, setDeleteAlertDialogVisible] = useState(false);

  const handleAfterUpdateDesignProject = () => {
    void mutateDesignProjects();
  };

  const handleDeleteDesignProject = (id?: string) => {
    if (!id) {
      toast.warning(t('common.toast.loading'));
      return;
    }

    toast.promise(deleteDesignProject(id), {
      loading: t('common.delete.loading'),
      success: () => {
        void mutateDesignProjects();
        return t('common.delete.success');
      },
      error: t('common.delete.error'),
    });
  };

  return (
    <main className="size-full">
      <UgcView
        assetKey="design-project"
        assetType="design-project"
        assetIdKey="id"
        assetName={t('components.layout.main.sidebar.list.apps.designs.label')}
        useUgcFetcher={useUgcDesignProjects}
        preloadUgcFetcher={preloadUgcDesignProjects}
        createColumns={createDesignProjectsColumns}
        renderOptions={{
          subtitle: (item) => (
            <span className="line-clamp-1">
              {`${item.user?.name ?? t('common.utils.unknown-user') + ' ' + t('common.utils.created-at', { time: formatTimeDiffPrevious(item.createdTimestamp) })}`}
            </span>
          ),
          cover: (item) => RenderIcon({ iconUrl: item.iconUrl, size: 'gallery' }),
        }}
        operateArea={(item, trigger, tooltipTriggerContent) => (
          <DropdownMenu>
            {tooltipTriggerContent ? (
              <Tooltip content={tooltipTriggerContent}>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
                </TooltipTrigger>
              </Tooltip>
            ) : (
              <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
            )}

            <DropdownMenuContent
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
              }}
            >
              <DropdownMenuLabel>{t('ugc-page.design-project.ugc-view.operate-area.dropdown-label')}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem
                  onSelect={() => {
                    setCurrentDesignProject(item);
                    setDesignProjectEditorVisible(true);
                  }}
                >
                  <DropdownMenuShortcut className="ml-0 mr-2 mt-0.5">
                    <Pencil size={15} />
                  </DropdownMenuShortcut>
                  {t('ugc-page.design-project.ugc-view.operate-area.options.edit-info')}
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => copy(location.origin.concat(`/${item.teamId}/design/${item.id}`))}>
                  <DropdownMenuShortcut className="ml-0 mr-2 mt-0.5">
                    <Link size={15} />
                  </DropdownMenuShortcut>
                  {t('ugc-page.design-project.ugc-view.operate-area.options.copy-link')}
                </DropdownMenuItem>
                {/*<DropdownMenuSeparator />*/}
                {/*<DropdownMenuItem onSelect={() => void handleCloneWorkflow(item.workflowId)}>*/}
                {/*  <DropdownMenuShortcut className="ml-0 mr-2 mt-0.5">*/}
                {/*    <Copy size={15} />*/}
                {/*  </DropdownMenuShortcut>*/}
                {/*  {t('ugc-page.design-project.ugc-view.operate-area.options.create-a-copy')}*/}
                {/*</DropdownMenuItem>*/}
                {/*<DropdownMenuSub>*/}
                {/*  <DropdownMenuSubTrigger>*/}
                {/*    <DropdownMenuShortcut className="ml-0 mr-2 mt-0.5">*/}
                {/*      <Download size={15} />*/}
                {/*    </DropdownMenuShortcut>*/}
                {/*    {t('settings.account.team.import-export.export.button')}*/}
                {/*  </DropdownMenuSubTrigger>*/}
                {/*  <DropdownMenuPortal>*/}
                {/*    <DropdownMenuSubContent>*/}
                {/*      <DropdownMenuItem*/}
                {/*        onSelect={() => {*/}
                {/*          setExportAssetContext({*/}
                {/*            workflowId: item.workflowId,*/}
                {/*            displayName: getI18nContent(item.displayName) ?? t('common.utils.untitled'),*/}
                {/*            version: item.version,*/}
                {/*          });*/}
                {/*          setExportDialogVisible(true);*/}
                {/*        }}*/}
                {/*      >*/}
                {/*        <DropdownMenuShortcut className="ml-0 mr-2 mt-0.5">*/}
                {/*          <FileUp size={15} />*/}
                {/*        </DropdownMenuShortcut>*/}
                {/*        {t('ugc-page.design-project.ugc-view.operate-area.options.export-current-version')}*/}
                {/*      </DropdownMenuItem>*/}
                {/*      <DropdownMenuItem*/}
                {/*        onSelect={() => {*/}
                {/*          setExportAssetContext({*/}
                {/*            workflowId: item.workflowId,*/}
                {/*            displayName: getI18nContent(item.displayName) ?? t('common.utils.untitled'),*/}
                {/*          });*/}
                {/*          setExportDialogVisible(true);*/}
                {/*        }}*/}
                {/*      >*/}
                {/*        <DropdownMenuShortcut className="ml-0 mr-2 mt-0.5">*/}
                {/*          <FolderUp size={15} />*/}
                {/*        </DropdownMenuShortcut>*/}
                {/*        {t('ugc-page.design-project.ugc-view.operate-area.options.export-all-versions')}*/}
                {/*      </DropdownMenuItem>*/}
                {/*    </DropdownMenuSubContent>*/}
                {/*  </DropdownMenuPortal>*/}
                {/*</DropdownMenuSub>*/}
                {/*<DropdownMenuSeparator />*/}
                {/*<DropdownMenuItem*/}
                {/*  onSelect={() => {*/}
                {/*    setPublishToMarketContext({*/}
                {/*      id: item.workflowId,*/}
                {/*      displayName: getI18nContent(item.displayName),*/}
                {/*      description: getI18nContent(item.description),*/}
                {/*      iconUrl: item.iconUrl,*/}
                {/*    });*/}
                {/*    setPublishToMarketVisible(true);*/}
                {/*  }}*/}
                {/*>*/}
                {/*  <DropdownMenuShortcut className="ml-0 mr-2 mt-0.5">*/}
                {/*    <Share size={15} />*/}
                {/*  </DropdownMenuShortcut>*/}
                {/*  {t('components.layout.ugc.publish-dialog.title')}*/}
                {/*</DropdownMenuItem>*/}
                {/*<DropdownMenuSeparator />*/}
                <DropdownMenuItem
                  className="text-red-10"
                  onSelect={() => {
                    setCurrentDesignProject(item);
                    setDeleteAlertDialogVisible(true);
                  }}
                >
                  <DropdownMenuShortcut className="ml-0 mr-2 mt-0.5">
                    <Trash size={15} />
                  </DropdownMenuShortcut>
                  {t('common.utils.delete')}
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        onItemClick={(item) => open(`/${item.teamId}/design/${item.id}`, '_blank')}
        subtitle={
          <>
            {/*<DropdownMenu>*/}
            {/*  <DropdownMenuTrigger asChild>*/}
            {/*    <Button variant="outline" size="small" icon={<Import />}>*/}
            {/*      {t('common.utils.import')}*/}
            {/*    </Button>*/}
            {/*  </DropdownMenuTrigger>*/}
            {/*  <DropdownMenuContent*/}
            {/*    onClick={(e) => {*/}
            {/*      e.stopPropagation();*/}
            {/*      e.preventDefault();*/}
            {/*    }}*/}
            {/*  >*/}
            {/*    <DropdownMenuGroup>*/}
            {/*      <DropdownMenuItem disabled>*/}
            {/*        {t('ugc-page.design-project.ugc-view.subtitle.import.options.local-import')}*/}
            {/*      </DropdownMenuItem>*/}
            {/*      <DropdownMenuItem*/}
            {/*        onSelect={() => {*/}
            {/*          void navigate({*/}
            {/*            to: '/$teamId/application-store/',*/}
            {/*            params: { teamId },*/}
            {/*          });*/}
            {/*        }}*/}
            {/*      >*/}
            {/*        {t('ugc-page.design-project.ugc-view.subtitle.import.options.market-import')}*/}
            {/*      </DropdownMenuItem>*/}
            {/*    </DropdownMenuGroup>*/}
            {/*  </DropdownMenuContent>*/}
            {/*</DropdownMenu>*/}
            <CreateDesignProjectDialog />
          </>
        }
      />
      <DesignProjectInfoEditor
        visible={designProjectEditorVisible}
        setVisible={setDesignProjectEditorVisible}
        designProject={currentDesignProject}
        afterUpdate={handleAfterUpdateDesignProject}
      />
      <AlertDialog open={deleteAlertDialogVisible} onOpenChange={setDeleteAlertDialogVisible}>
        <AlertDialogContent
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
          }}
        >
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('common.dialog.delete-confirm.title', {
                type: t('common.type.design-project'),
              })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('common.dialog.delete-confirm.content', {
                type: t('common.type.design-project'),
                name: getI18nContent(currentDesignProject?.displayName) ?? t('common.utils.unknown'),
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.utils.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleDeleteDesignProject(currentDesignProject?.id)}>
              {t('common.utils.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
};

export const Route = createLazyFileRoute('/$teamId/designs/')({
  component: Designs,
});
