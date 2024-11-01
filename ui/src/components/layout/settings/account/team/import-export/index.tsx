import React, { useState } from 'react';

import { Database, FileDown, FileUp, SquareArrowOutUpRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { IVinesTeam } from '@/apis/authz/team/typings.ts';
import { ExportTeam } from '@/components/layout/settings/account/team/import-export/export';
import { ExportTeamAsBuiltInMarket } from '@/components/layout/settings/account/team/import-export/export-as-built-in-market';
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

interface IImportExportTeamProps extends React.ComponentPropsWithoutRef<'div'> {
  team?: IVinesTeam;
}

export const ImportExportTeam: React.FC<IImportExportTeamProps> = ({ team }) => {
  const { t } = useTranslation();

  const [exportVisible, setExportVisible] = useState(false);

  const exportEnabled = false;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button icon={<Database />} size="small" variant="outline">
            {t('settings.account.team.import-export.button')}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel>{t('settings.account.team.import-export.dropdown-label')}</DropdownMenuLabel>
          {exportEnabled && (
            <>
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
            </>
          )}
          <DropdownMenuSeparator />
          <ExportTeamAsBuiltInMarket team={team}>
            <DropdownMenuItem
              onSelect={(e) => {
                e.stopPropagation();
                e.preventDefault();
              }}
            >
              <DropdownMenuShortcut className="ml-0 mr-2 mt-0.5">
                <SquareArrowOutUpRight size={15} />
              </DropdownMenuShortcut>
              {t('settings.account.team.import-export.export-as-built-in-market.button')}
            </DropdownMenuItem>
          </ExportTeamAsBuiltInMarket>
        </DropdownMenuContent>
      </DropdownMenu>

      <ExportTeam visible={exportVisible} setVisible={setExportVisible} />
    </>
  );
};
