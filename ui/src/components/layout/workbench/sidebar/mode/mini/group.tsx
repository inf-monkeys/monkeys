import React, { useRef } from 'react';

import { FolderIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Virtualizer } from 'virtua';

import { IPageGroup, IPinPage } from '@/apis/pages/typings.ts';
import { ScrollArea } from '@/components/ui/scroll-area.tsx';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { VinesLucideIcon } from '@/components/ui/vines-icon/lucide';
import { cn, getI18nContent } from '@/utils';

interface IWorkbenchMiniGroupListProps extends React.ComponentPropsWithoutRef<'div'> {
  groupId: string;
  setGroupId: React.Dispatch<React.SetStateAction<string>>;
  data: (Omit<IPageGroup, 'pageIds'> & { pages: IPinPage[] })[];
  height: number;
}

export const WorkbenchMiniGroupList: React.FC<IWorkbenchMiniGroupListProps> = ({
  groupId,
  setGroupId,
  data,
  height,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();

  if (!data?.length) return null;

  return (
    <ScrollArea
      className="-mr-2 pr-2"
      ref={scrollRef}
      style={{ height: Math.min(height * 0.3, 200) }}
      disabledOverflowMask
    >
      <Virtualizer scrollRef={scrollRef}>
        {data.map(({ displayName, id, iconUrl }) => (
          <div key={id} className="flex justify-center">
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className={cn(
                    'flex h-10 w-10 cursor-pointer items-center justify-center rounded-md border border-transparent transition-colors hover:bg-accent hover:text-accent-foreground',
                    groupId === id && 'border-input bg-background text-accent-foreground',
                  )}
                  onClick={() => setGroupId(id)}
                >
                  {typeof iconUrl === 'string' ? (
                    <VinesLucideIcon className="size-4 shrink-0" size={16} src={iconUrl} />
                  ) : (
                    <FolderIcon className="size-4 shrink-0" size={16} />
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent side="right" align="start" alignOffset={-4} sideOffset={8}>
                <span>
                  {t([
                    `workspace.wrapper.space.tabs.${getI18nContent(displayName) || 'unknown'}`,
                    getI18nContent(displayName) || 'Unknown Group',
                  ])}
                </span>
              </TooltipContent>
            </Tooltip>
          </div>
        ))}
      </Virtualizer>
    </ScrollArea>
  );
};
