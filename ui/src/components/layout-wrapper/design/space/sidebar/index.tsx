import React from 'react';

import { useParams } from '@tanstack/react-router';

import { useDesignProjectMetadataList } from '@/apis/designs';
import { DesignSpaceTab } from '@/components/layout-wrapper/design/space/sidebar/tab.tsx';
import { SpaceSidebarTabsList } from '@/components/layout-wrapper/space/sidebar/tabs.tsx';

interface IDesignSpaceSidebarProps extends React.ComponentPropsWithoutRef<'div'> {}

export const DesignSpaceSidebar: React.FC<IDesignSpaceSidebarProps> = () => {
  const { designProjectId } = useParams({ from: '/$teamId/design/$designProjectId/$designBoardId/' });

  const { data: boards } = useDesignProjectMetadataList(designProjectId);

  return (
    <SpaceSidebarTabsList>
      {boards &&
        boards.map((board) => <DesignSpaceTab key={board.id} value={board.id} displayName={board.displayName} />)}
    </SpaceSidebarTabsList>
  );
};
