import React from 'react';

import { Database, FileDown, FileUp } from 'lucide-react';

import { Button } from '@/components/ui/button';
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

interface IImportExportTeamProps extends React.ComponentPropsWithoutRef<'div'> {}

export const ImportExportTeam: React.FC<IImportExportTeamProps> = () => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button icon={<Database />} size="small">
          数据
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>团队数据管理</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <DropdownMenuShortcut className="ml-0 mr-2 mt-0.5">
              <FileDown size={15} />
            </DropdownMenuShortcut>
            导入数据
          </DropdownMenuItem>
          <DropdownMenuItem>
            <DropdownMenuShortcut className="ml-0 mr-2 mt-0.5">
              <FileUp size={15} />
            </DropdownMenuShortcut>
            导出数据
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
