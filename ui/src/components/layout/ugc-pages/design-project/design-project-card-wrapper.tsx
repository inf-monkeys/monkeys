import { useDesignProjectMetadataList } from '@/apis/designs';
import { IDesignBoardMetadata, IDesignProject } from '@/apis/designs/typings';
import { IAssetItem } from '@/apis/ugc/typings';
import { DesignProjectCard } from '@/components/layout/ugc-pages/design-project/design-project-card';
import React from 'react';

interface DesignProjectCardWrapperProps {
  project: IAssetItem<IDesignProject>;
  onItemClick: (project: IAssetItem<IDesignProject>) => void;
  operateArea?: (item: IAssetItem<IDesignProject>, trigger: React.ReactNode, tooltipTriggerContent?: string) => React.ReactNode;
}

export const DesignProjectCardWrapper: React.FC<DesignProjectCardWrapperProps> = ({
  project,
  onItemClick,
  operateArea,
}) => {
  // 获取项目的第一个画板
  const { data: boards } = useDesignProjectMetadataList(project.id);
  const firstBoard = boards?.[0] as IDesignBoardMetadata | undefined;

  return (
    <DesignProjectCard
      project={project}
      firstBoard={firstBoard}
      onItemClick={onItemClick}
      operateArea={operateArea}
    />
  );
};