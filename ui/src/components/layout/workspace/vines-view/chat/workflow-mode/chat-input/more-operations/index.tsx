import React from 'react';

import type { EventEmitter } from 'ahooks/lib/useEventEmitter';
import { Ellipsis, RotateCcw, Undo2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { TTabularEvent } from '@/components/layout/workspace/vines-view/form/tabular/render';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu.tsx';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface IChatInputMoreOperationsProps {
  tabular$: EventEmitter<TTabularEvent>;
}

export const ChatInputMoreOperations: React.FC<IChatInputMoreOperationsProps> = ({ tabular$ }) => {
  const { t } = useTranslation();

  return (
    <DropdownMenu>
      <Tooltip>
        <DropdownMenuTrigger asChild>
          <TooltipTrigger asChild>
            <Button variant="outline" size="small" icon={<Ellipsis />} />
          </TooltipTrigger>
        </DropdownMenuTrigger>
        <TooltipContent>{t('workspace.form-view.quick-toolbar.more')}</TooltipContent>
      </Tooltip>
      <DropdownMenuContent onClick={(e) => e.preventDefault()}>
        <DropdownMenuItem
          onClick={(e) => {
            e.preventDefault();
            tabular$.emit('restore-previous-param');
          }}
        >
          <DropdownMenuShortcut className="ml-0 mr-2 mt-0.5">
            <Undo2 size={15} />
          </DropdownMenuShortcut>
          {t('workspace.form-view.quick-toolbar.restore-previous-param.label')}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={(e) => {
            e.preventDefault();
            tabular$.emit('reset');
          }}
        >
          <DropdownMenuShortcut className="ml-0 mr-2 mt-0.5">
            <RotateCcw size={15} />
          </DropdownMenuShortcut>
          {t('workspace.form-view.quick-toolbar.reset')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
