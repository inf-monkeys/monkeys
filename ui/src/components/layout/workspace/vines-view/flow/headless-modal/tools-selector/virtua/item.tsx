import React from 'react';

import { Link2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Card } from '@/components/ui/card.tsx';
import { Tag } from '@/components/ui/tag';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { VinesIcon } from '@/components/ui/vines-icon';
import { VinesToolDef } from '@/package/vines-flow/core/tools/typings.ts';
import { cn, getI18nContent } from '@/utils';

interface IVirtuaToolListItemProps {
  tool: VinesToolDef;

  category: string;

  onClick?: (tool: VinesToolDef) => void;
}

export const VirtuaToolListItem: React.FC<IVirtuaToolListItemProps> = ({ tool, category, onClick }) => {
  const { t } = useTranslation();

  const toolName = tool?.displayName;
  const toolDesc = tool?.description;
  return (
    <div key={tool.name} className="w-64 px-1 pt-2">
      <Card
        className="flex size-full cursor-pointer items-center gap-4 overflow-hidden p-4 hover:bg-gray-2 dark:hover:bg-gray-3"
        onClick={() => onClick?.(tool)}
        onDoubleClick={() => onClick?.(tool)}
      >
        <div className="relative flex h-12 w-12 flex-shrink-0 items-end justify-end overflow-hidden rounded-lg border-input shadow-md">
          <div className="absolute">
            <VinesIcon className="size-full" size="lg" src={tool.icon} disabledPreview />
          </div>
          {(category === 'sub-workflow' || tool.type === 'SUB_WORKFLOW') && (
            <div className="z-20 translate-x-[0.5px] translate-y-[0.5px] scale-90 rounded-lg rounded-bl-none rounded-tr-none bg-white bg-opacity-45 p-1 opacity-80">
              <Link2 size={12} className="text-vines-500" />
            </div>
          )}
        </div>
        <div className="leading-5">
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="line-clamp-1 font-bold">{getI18nContent(toolName)}</div>
            </TooltipTrigger>
            <TooltipContent>{getI18nContent(toolName)}</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className={cn(
                  'mt-1 items-center gap-1 text-xs opacity-50',
                  tool.categories?.includes('service') || tool.categories?.includes('api')
                    ? 'line-clamp-1'
                    : 'line-clamp-2',
                )}
              >
                {tool.categories?.includes('api') && (
                  <Tag size="xs" color="primary">
                    {t('workspace.flow-view.headless-modal.tool-selector.category.api')}
                  </Tag>
                )}
                {tool.categories?.includes('service') && (
                  <Tag size="xs" color="primary">
                    {t('workspace.flow-view.headless-modal.tool-selector.category.service')}
                  </Tag>
                )}
                {getI18nContent(toolDesc)}
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-64">
              {getI18nContent(toolDesc)}
            </TooltipContent>
          </Tooltip>
        </div>
      </Card>
    </div>
  );
};
