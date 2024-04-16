import React from 'react';

import { createFileRoute } from '@tanstack/react-router';

import { preloadUgcTableData, useUgcTableData } from '@/apis/ugc';
import { UgcView } from '@/components/layout/ugc/view';
import { RenderIcon } from '@/components/layout/ugc/view/utils/renderer.tsx';
import { createTableDataColumns } from '@/components/layout/ugc-pages/table-data/consts.tsx';
import { teamIdGuard } from '@/components/router/guard/team-id.ts';
import { formatTimeDiffPrevious } from '@/utils/time.ts';

export const TableData: React.FC = () => {
  return (
    <main className="size-full">
      <UgcView
        assetKey="table-data"
        assetType="knowledge-base-table"
        assetName="表格数据"
        useUgcFetcher={useUgcTableData}
        preloadUgcFetcher={preloadUgcTableData}
        createColumns={() => createTableDataColumns()}
        renderOptions={{
          subtitle: (item) => (
            <div className="flex gap-1">
              <span>{item.user?.name ?? '未知'}</span>
              <span>创建于</span>
              <span>{formatTimeDiffPrevious(item.createdTimestamp)}</span>
            </div>
          ),
          cover: (item) => RenderIcon({ iconUrl: item.iconUrl, size: 'gallery' }),
        }}
      />
    </main>
  );
};

export const Route = createFileRoute('/$teamId/table-data/')({
  component: TableData,
  beforeLoad: teamIdGuard,
});
