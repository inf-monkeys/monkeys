import React from 'react';

import { CreatePageDto } from '@inf-monkeys/vines/lib/models/CreatePageDto';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';

import { createWorkspacePage, useWorkspacePageInstances } from '@/apis/pages';
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
  const { workflowId, pagesMutate, navigateTo } = useVinesPage();
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
      const newPageId = newPages.at(-1)?._id;
      newPageId && (await navigateTo(newPageId));
    }
  };

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
          <TooltipContent>新建视图</TooltipContent>
        </Tooltip>
        <DropdownMenuContent>
          <DropdownMenuLabel>新建视图</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            {data
              ?.filter(({ type }) => type !== 'process')
              ?.map(({ type, icon, name }) => (
                <DropdownMenuItem key={type} className="flex items-center gap-2" onClick={() => handleAddPage(type)}>
                  <VinesIcon size="xs">{icon}</VinesIcon>
                  <p>{name}</p>
                </DropdownMenuItem>
              ))}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </motion.div>
  );
};
