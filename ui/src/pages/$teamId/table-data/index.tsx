import React from 'react';

import { createFileRoute, useNavigate } from '@tanstack/react-router';

import { preloadUgcTableData, useUgcTableData } from '@/apis/ugc';
import { createTableDataColumns } from '@/components/layout/ugc-pages/table-data/consts.tsx';
import { CreateDatabase } from '@/components/layout/ugc-pages/table-data/create-database';
import { OperateArea } from '@/components/layout/ugc-pages/table-data/operate-area';
import { UgcView } from '@/components/layout/ugc/view';
import { RenderIcon } from '@/components/layout/ugc/view/utils/renderer.tsx';
import { teamIdGuard } from '@/components/router/guard/team-id.ts';
import { formatTimeDiffPrevious } from '@/utils/time.ts';

export const TableData: React.FC = () => {
  const navigate = useNavigate();

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
            <span className="line-clamp-1">
              {`${item.user?.name ?? '未知'} 创建于 ${formatTimeDiffPrevious(item.createdTimestamp)}`}
            </span>
          ),
          cover: (item) => RenderIcon({ iconUrl: item.iconUrl, size: 'gallery' }),
        }}
        operateArea={(item, trigger, tooltipTriggerContent) => (
          <OperateArea item={item} trigger={trigger} tooltipTriggerContent={tooltipTriggerContent} />
        )}
        subtitle={<CreateDatabase />}
        onItemClick={(item) => {
          void navigate({
            to: `/$teamId/table-data/${item.uuid}`,
          });
        }}
      />
    </main>
  );
};

export const Route = createFileRoute('/$teamId/table-data/')({
  component: TableData,
  beforeLoad: teamIdGuard,
});
