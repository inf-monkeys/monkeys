import React, { useState } from 'react';

import { Database, FileDown, FileUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();

  const [exportVisible, setExportVisible] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button icon={<Database />} size="small">
            {t('settings.account.team.import-export.button')}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel>{t('settings.account.team.import-export.dropdown-label')}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem>
              <DropdownMenuShortcut className="ml-0 mr-2 mt-0.5">
                <FileDown size={15} />
              </DropdownMenuShortcut>
              {t('settings.account.team.import-export.import.button')}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setExportVisible(true)}>
              <DropdownMenuShortcut className="ml-0 mr-2 mt-0.5">
                <FileUp size={15} />
              </DropdownMenuShortcut>
              {t('settings.account.team.import-export.export.button')}
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <ExportTeam visible={exportVisible} setVisible={setExportVisible} />
    </>
  );
};
