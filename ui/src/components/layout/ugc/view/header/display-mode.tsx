import React, { useMemo } from 'react';

import _ from 'lodash';
import { CreditCard, Folder, Images, Table2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { IDisplayMode, IDisplayModeStorage } from '@/components/layout/ugc/typings.ts';
import { useVinesTeam } from '@/components/router/guard/team.tsx';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu.tsx';
import { Tooltip, TooltipTrigger } from '@/components/ui/tooltip';
import { useLocalStorage } from '@/hooks/use-local-storage';

// 支持文件夹视图的 assetType 白名单
const FOLDER_VIEW_WHITELIST = ['media-data'];

interface IUgcHeaderDisplayModeButtonProps extends React.ComponentPropsWithoutRef<'div'> {
  assetKey: string;
}

export const UgcHeaderDisplayModeButton: React.FC<IUgcHeaderDisplayModeButtonProps> = ({ assetKey }) => {
  const { t } = useTranslation();

  const team = useVinesTeam();

  const assetType = assetKey.includes(':') ? assetKey.split(':')[1] : assetKey;

  const supportsFolderView = FOLDER_VIEW_WHITELIST.includes(assetType);

  const [displayModeStorage, setDisplayModeStorage] = useLocalStorage<IDisplayModeStorage>(
    `vines-ui-asset-display-mode`,
    {},
  );

  const displayMode = useMemo(
    () => _.get(displayModeStorage, [team.teamId, assetKey], 'card'),
    [displayModeStorage, team.teamId, assetKey],
  );

  const displayModeIcon = useMemo(
    () =>
      displayMode ? (
        displayMode === 'table' ? (
          <Table2 />
        ) : displayMode === 'gallery' ? (
          <Images />
        ) : displayMode === 'folder' ? (
          <Folder />
        ) : (
          <CreditCard />
        )
      ) : (
        <CreditCard />
      ),
    [displayMode],
  );

  return (
    <DropdownMenu>
      <Tooltip content={t('components.layout.ugc.view.header.display-mode.button-tooltip')}>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button icon={displayModeIcon} variant="outline" size="small" />
          </DropdownMenuTrigger>
        </TooltipTrigger>
      </Tooltip>
      <DropdownMenuContent>
        <DropdownMenuLabel>{t('components.layout.ugc.view.header.display-mode.dropdown-label')}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup
          value={displayMode ?? 'card'}
          onValueChange={(v) => {
            setDisplayModeStorage((prev) => {
              return {
                ...prev,
                [team.teamId]: {
                  ...prev[team.teamId],
                  [assetKey]: v as IDisplayMode,
                },
              };
            });
          }}
        >
          <DropdownMenuRadioItem value="table">
            {t('components.layout.ugc.view.header.display-mode.options.table')}
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="gallery">
            {t('components.layout.ugc.view.header.display-mode.options.gallery')}
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="card">
            {t('components.layout.ugc.view.header.display-mode.options.card')}
          </DropdownMenuRadioItem>
          {supportsFolderView && (
            <DropdownMenuRadioItem value="folder">
              {t('components.layout.ugc.view.header.display-mode.options.folder')}
            </DropdownMenuRadioItem>
          )}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
