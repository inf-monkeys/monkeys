import React from 'react';

import { Link2 } from 'lucide-react';
import { FixedSizeGrid as Grid, GridChildComponentProps } from 'react-window';

import { Card } from '@/components/ui/card.tsx';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { VinesIcon } from '@/components/ui/vines-icon';
import { VinesToolDef } from '@/package/vines-flow/core/tools/typings.ts';

interface IToolListsProps {
  onClick?: (tool: VinesToolDef) => void;
  list: VinesToolDef[];
  length: number;
  category: string;
}

export const ToolLists: React.FC<IToolListsProps> = ({ list, length, category, onClick }) => {
  return (
    <Grid
      columnCount={3}
      columnWidth={250}
      height={450}
      rowCount={Math.ceil(length / 3)}
      rowHeight={100}
      width={758}
      itemData={list}
    >
      {({ columnIndex, rowIndex, style, data }: GridChildComponentProps) => {
        const tool: VinesToolDef = data[rowIndex * 3 + columnIndex];
        const toolName = tool?.displayName;
        const toolDesc = tool?.description;
        return (
          tool && (
            <div key={tool.name} className="px-1 pt-2" style={style}>
              <Card
                className="flex size-full cursor-pointer items-center gap-4 p-4 hover:bg-gray-2 dark:hover:bg-gray-3"
                onClick={() => onClick?.(tool)}
                onDoubleClick={() => onClick?.(tool)}
              >
                <div className="relative flex h-12 w-12 flex-shrink-0 items-end justify-end overflow-clip rounded-lg border-input shadow-md">
                  <div className="absolute">
                    <VinesIcon className="size-full" size="lg" src={tool.icon} />
                  </div>
                  {category === 'block' && (
                    <div className="z-20 translate-x-[0.5px] translate-y-[0.5px] scale-90 rounded-lg rounded-bl-none rounded-tr-none bg-white bg-opacity-45 p-1 opacity-80">
                      <Link2 size={12} className="text-vines-500" />
                    </div>
                  )}
                </div>
                <div className="leading-5">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="line-clamp-1 font-bold">{toolName}</div>
                    </TooltipTrigger>
                    <TooltipContent>{toolName}</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="mt-1 line-clamp-1 text-xs opacity-50">{toolDesc}</div>
                    </TooltipTrigger>
                    <TooltipContent
                      side="bottom"
                      align={columnIndex === 0 ? 'start' : columnIndex === 2 ? 'end' : 'center'}
                      className="max-w-64"
                    >
                      {toolDesc}
                    </TooltipContent>
                  </Tooltip>
                </div>
              </Card>
            </div>
          )
        );
      }}
    </Grid>
  );
};
