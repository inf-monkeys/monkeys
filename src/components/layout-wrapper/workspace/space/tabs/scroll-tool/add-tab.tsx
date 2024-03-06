import React from 'react';

import { useNavigate } from '@tanstack/react-router';

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
import { Route } from '@/pages/$teamId/workspace/$workflowId/$pageId';

interface IAddSpaceTabProps extends React.ComponentPropsWithoutRef<'div'> {}

export const AddSpaceTab: React.FC<IAddSpaceTabProps> = () => {
  const navigate = useNavigate({ from: Route.fullPath });
  const { workflowId, pagesMutate } = useVinesPage();
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

    await pagesMutate(newPages, { revalidate: false });
    const newPageId = newPages.at(-1)?._id;
    if (newPageId) {
      await navigate({
        to: '/$teamId/workspace/$workflowId/$pageId',
        params: {
          pageId: newPageId,
        },
      });
    }
  };

  return (
    <motion.div
      key="vines-workspace-add-page-button"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="ml-2 flex h-full"
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
            {data?.map(({ type, icon, name }) => (
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
