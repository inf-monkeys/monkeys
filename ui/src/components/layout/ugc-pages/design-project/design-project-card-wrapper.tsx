import React from 'react';

import { IDesignProject } from '@/apis/designs/typings';
import { IAssetItem } from '@/apis/ugc/typings';
import { DesignProjectCard } from '@/components/layout/ugc-pages/design-project/design-project-card';

interface DesignProjectCardWrapperProps {
  project: IAssetItem<IDesignProject>;
  onItemClick: (project: IAssetItem<IDesignProject>) => void;
  operateArea?: (
    item: IAssetItem<IDesignProject>,
    trigger: React.ReactNode,
    tooltipTriggerContent?: string,
  ) => React.ReactNode;
}

export const DesignProjectCardWrapper: React.FC<DesignProjectCardWrapperProps> = ({
  project,
  onItemClick,
  operateArea,
}) => {
  // 🚀 性能优化：直接从项目数据中读取第一个画板信息
  // 后端已经在列表API中返回了 firstBoard 字段，避免了N+1查询问题
  const firstBoard = (project as any).firstBoard;

  return (
    <DesignProjectCard project={project} firstBoard={firstBoard} onItemClick={onItemClick} operateArea={operateArea} />
  );
};
