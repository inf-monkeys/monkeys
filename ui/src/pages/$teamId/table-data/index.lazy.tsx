import React from 'react';

import { createLazyFileRoute, useNavigate } from '@tanstack/react-router';

import { useTranslation } from 'react-i18next';

import { preloadUgcTableData, useUgcTableData } from '@/apis/ugc';
import { UgcView } from '@/components/layout/ugc/view';
import { RenderIcon } from '@/components/layout/ugc/view/utils/renderer.tsx';
import { createTableDataColumns } from '@/components/layout/ugc-pages/table-data/consts.tsx';
import { CreateDatabase } from '@/components/layout/ugc-pages/table-data/create-database';
import { OperateArea } from '@/components/layout/ugc-pages/table-data/operate-area';
import { formatTimeDiffPrevious } from '@/utils/time.ts';

export const TableData: React.FC = () => {
  const { t: tHook } = useTranslation();

  const navigate = useNavigate();

  return (
    <main className="size-full">
      <UgcView
        assetKey="table-data"
        assetType="sql-knowledge-base"
        assetName={tHook('components.layout.main.sidebar.list.media.table-data.label')}
        useUgcFetcher={useUgcTableData}
        preloadUgcFetcher={preloadUgcTableData}
        createColumns={() => createTableDataColumns()}
        renderOptions={{
          subtitle: (item) => (
            <span className="line-clamp-1">
              {`${item.user?.name ?? tHook('common.utils.unknown')} ${tHook('common.utils.created-at', {
                time: formatTimeDiffPrevious(item.createdTimestamp),
              })}`}
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

export const Route = createLazyFileRoute('/$teamId/table-data/')({
  component: TableData,
});
