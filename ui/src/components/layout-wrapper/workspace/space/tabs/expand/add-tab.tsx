import React from 'react';

import { motion } from 'framer-motion';
import { CodeSquare, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { createWorkspacePage, useWorkspacePageInstances } from '@/apis/pages';
import { CreatePageDto } from '@/apis/pages/typings';
import { useVinesPage } from '@/components/layout-wrapper/workspace/utils.ts';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu.tsx';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { VinesIcon } from '@/components/ui/vines-icon';
import { cn } from '@/utils';

interface IAddSpaceTabProps extends React.ComponentPropsWithoutRef<'div'> {}

export const AddSpaceTab: React.FC<IAddSpaceTabProps> = ({ className }) => {
  const { t } = useTranslation();

  const { workflowId, pages, pagesMutate, navigateTo } = useVinesPage();
  const { data } = useWorkspacePageInstances();

  const handleAddPage = async (pageType: string) => {
    if (!data) return;
    const pageInstance = data.find(({ type }) => type === pageType);
    if (!pageInstance) return;

    const newPages = await createWorkspacePage(workflowId, {
      type: pageType as CreatePageDto.type,
      permissions: pageInstance.allowedPermissions,
      displayName: pageInstance.name,
    });

    if (newPages) {
      await pagesMutate(newPages, { revalidate: false });
      const newPageId = newPages.at(-1)?.id;
      newPageId && (await navigateTo(newPageId));
    }
  };

  const viewList = data?.filter(({ type }) => !(pages?.map(({ type }) => type) ?? []).includes(type)) ?? [];
  const isEmpty = !viewList.length;

  return (
    <motion.div
      key="vines-workspace-add-page-button"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={cn('ml-2 flex h-full', className)}
    >
      <DropdownMenu>
        <Tooltip>
          <DropdownMenuTrigger asChild>
            <TooltipTrigger asChild>
              <Button icon={<Plus />} className="my-auto !scale-75" variant="outline" />
            </TooltipTrigger>
          </DropdownMenuTrigger>
          <TooltipContent>{t('workspace.wrapper.space.add-tab.label')}</TooltipContent>
        </Tooltip>
        <DropdownMenuContent>
          <DropdownMenuLabel>{t('workspace.wrapper.space.add-tab.label')}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            {viewList.map(({ type, icon, name }) => (
              <DropdownMenuItem key={type} className="flex items-center gap-2" onClick={() => handleAddPage(type)}>
                <VinesIcon size="xs">{icon}</VinesIcon>
                <p>{t([`workspace.wrapper.space.tabs.${name}`, name])}</p>
              </DropdownMenuItem>
            ))}
            {isEmpty && <DropdownMenuItem disabled>{t('workspace.wrapper.space.add-tab.empty')}</DropdownMenuItem>}
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuItem className="flex items-center gap-2">
                <CodeSquare size={16} />
                {t('workspace.wrapper.space.add-tab.create-custom-code-view.button')}
              </DropdownMenuItem>
            </TooltipTrigger>
            <TooltipContent className="w-52 space-y-1" side="left" sideOffset={8} align="start">
              <h1 className="text-sm font-bold">
                {t('workspace.wrapper.space.add-tab.create-custom-code-view.tips.title')}
              </h1>
              <p className="text-xs text-gray-12">
                {t('workspace.wrapper.space.add-tab.create-custom-code-view.tips.desc')}
              </p>
            </TooltipContent>
          </Tooltip>
        </DropdownMenuContent>
      </DropdownMenu>
    </motion.div>
  );
};
