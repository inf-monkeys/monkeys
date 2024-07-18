import React from 'react';

import { Tag } from '@/components/ui/tag';
import i18n from '@/i18n.ts';
import { cn } from '@/utils';

const t = i18n.t;

interface IWorkflowVersionTagProps {
  version: number;
  onClick?: (version: number) => void;
}

export const WorkflowVersionTag: React.FC<IWorkflowVersionTagProps> = ({ version, onClick }) => {
  const displayName =
    version === -1
      ? t('workspace.logs-view.list.item.temporary-workflow')
      : t('workspace.logs-view.list.item.version', { version });
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
