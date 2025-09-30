import { useParams } from '@tanstack/react-router';

import { get } from 'lodash';

import { useSystemConfig } from '@/apis/common';
import { useDesignBoardMetadata, useGetDesignProject } from '@/apis/designs';
import { cn, getI18nContent } from '@/utils';

export const DesignsExtraInfo = () => {
  const { designProjectId, designBoardId } = useParams({ from: '/$teamId/design/$designProjectId/$designBoardId/' });

  const { data: oem } = useSystemConfig();

  const oemId = get(oem, ['theme', 'id'], undefined);

  const { data: designProjectMetadata } = useGetDesignProject(designProjectId ?? null);
  const { data: designBoardMetadata } = useDesignBoardMetadata(designBoardId ?? null);

  return designProjectMetadata && designBoardMetadata ? (
    <span className="flex items-center gap-1.5 text-xs">
      <span className={cn('text-opacity-50', oemId === 'artist' ? 'text-white' : 'text-muted-foreground')}>
        {getI18nContent(designProjectMetadata.displayName)}
      </span>
      <span className={cn('text-opacity-50', oemId === 'artist' ? 'text-white' : 'text-muted-foreground')}>/</span>
      <span className={cn(oemId === 'artist' ? 'text-white' : 'text-muted-foreground')}>
        {getI18nContent(designBoardMetadata.displayName)}
      </span>
    </span>
  ) : null;
};
