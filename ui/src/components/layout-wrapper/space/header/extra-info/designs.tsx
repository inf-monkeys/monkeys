import { useParams } from '@tanstack/react-router';

import { get } from 'lodash';

import { useSystemConfig } from '@/apis/common';
import { useDesignBoardMetadata, useGetDesignProject } from '@/apis/designs';
import { cn, getI18nContent } from '@/utils';

interface DesignsExtraInfoProps {
  tabId?: string;
}

export const DesignsExtraInfo = ({ tabId }: DesignsExtraInfoProps) => {
  const { designProjectId, designBoardId } = useParams({ from: '/$teamId/design/$designProjectId/$designBoardId/' });

  const { data: oem } = useSystemConfig();

  const oemId = get(oem, ['theme', 'id'], undefined);

  const { data: designProjectMetadata } = useGetDesignProject(designProjectId ?? null);
  const { data: designBoardMetadata } = useDesignBoardMetadata(designBoardId ?? null);

  // 如果没有设计项目或画板数据，不显示
  if (!designProjectMetadata || !designBoardMetadata) {
    return null;
  }

  // 根据标签页 ID 和项目的 isTemplate 属性来决定是否显示
  const isTemplate = designProjectMetadata.isTemplate;
  const shouldShow =
    (tabId === 'designs' && !isTemplate) || (tabId === 'designs-templates' && isTemplate);

  if (!shouldShow) {
    return null;
  }

  return (
    <span className="flex items-center gap-1.5 text-xs">
      <span className={cn('text-opacity-50', oemId === 'artist' ? 'text-white' : 'text-muted-foreground')}>
        {getI18nContent(designProjectMetadata.displayName)}
      </span>
      <span className={cn('text-opacity-50', oemId === 'artist' ? 'text-white' : 'text-muted-foreground')}>/</span>
      <span className={cn(oemId === 'artist' ? 'text-white' : 'text-muted-foreground')}>
        {getI18nContent(designBoardMetadata.displayName)}
      </span>
    </span>
  );
};
