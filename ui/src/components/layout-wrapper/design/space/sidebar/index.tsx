import React from 'react';

import { useParams } from '@tanstack/react-router';

import { useTranslation } from 'react-i18next';

import { useDesignProjectMetadataList } from '@/apis/designs';
import { DesignSpaceTab } from '@/components/layout-wrapper/design/space/sidebar/tab.tsx';
import { SpaceSidebarTabsList } from '@/components/layout-wrapper/space/sidebar/tabs.tsx';

interface IDesignSpaceSidebarProps extends React.ComponentPropsWithoutRef<'div'> {}

export const DesignSpaceSidebar: React.FC<IDesignSpaceSidebarProps> = () => {
  const { t } = useTranslation();

  const { designProjectId } = useParams({ from: '/$teamId/design/$designProjectId/$designBoardId/' });

  const { data: boards } = useDesignProjectMetadataList(designProjectId);

  console.log(boards);

  return (
    <SpaceSidebarTabsList>
      {boards &&
        boards.map((board) => <DesignSpaceTab key={board.id} value={board.id} displayName={board.displayName} />)}
    </SpaceSidebarTabsList>
  );
};
