import React from 'react';

import { Tag } from '@/components/ui/tag';
import { cn } from '@/utils';

interface IWorkflowVersionTagProps {
  version: number;
  onClick?: (version: number) => void;
}

export const WorkflowVersionTag: React.FC<IWorkflowVersionTagProps> = ({ version, onClick }) => {
  const displayName = version === -1 ? '临时工作流' : `版本号：${version}`;
  const color = version === -1 ? 'warning' : 'primary';
  return (
    <Tag
      className={cn(!!onClick && 'cursor-pointer')}
      color={color}
      onClick={onClick ? () => onClick(version) : undefined}
      size="xs"
    >
      {displayName}
    </Tag>
  );
};
