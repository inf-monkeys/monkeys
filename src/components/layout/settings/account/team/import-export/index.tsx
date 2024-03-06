import React, { useState } from 'react';

import { Database, FileDown, FileUp } from 'lucide-react';

import { ExportTeam } from '@/components/layout/settings/account/team/import-export/export';
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
  const [exportVisible, setExportVisible] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button icon={<Database />} size="small">
            数据管理
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
            <DropdownMenuItem onSelect={() => setExportVisible(true)}>
              <DropdownMenuShortcut className="ml-0 mr-2 mt-0.5">
                <FileUp size={15} />
              </DropdownMenuShortcut>
              导出数据
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <ExportTeam visible={exportVisible} setVisible={setExportVisible} />
    </>
  );
};
