import React from 'react';

import { useSWRConfig } from 'swr';

import { Import, Plus, RefreshCwIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { ITableData, SqlKnowledgeBaseCreateType } from '@/apis/table-data/typings';
import { CreateTable } from '@/components/layout/ugc-pages/table-data/table-detail/header/create-table.tsx';
import { ImportTableData } from '@/components/layout/ugc-pages/table-data/table-detail/header/import-table-data.tsx';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface ITableDetailHeaderProps {
  database: ITableData;
}

export const TableDetailHeader: React.FC<ITableDetailHeaderProps> = ({ database }) => {
  const { t } = useTranslation();
  const { mutate } = useSWRConfig();
  const databaseId = database?.uuid;
  const isExternalDatabase = database?.createType === SqlKnowledgeBaseCreateType.external;

  const handleRefresh = () => {
    toast.promise(
      mutate((key) => typeof key === 'string' && key.startsWith(`/api/sql-knowledge-bases/${databaseId}/tables`)),
      {
        loading: t('common.update.loading'),
        success: t('common.update.success'),
        error: t('common.update.error'),
      },
    );
  };

  return (
    <header className="flex w-full items-center justify-end gap-2 pb-2">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button size="small" variant="outline" icon={<RefreshCwIcon />} onClick={handleRefresh} />
        </TooltipTrigger>
        <TooltipContent>{t('ugc-page.table-data.detail.header.refresh.tooltip')}</TooltipContent>
      </Tooltip>
      <ImportTableData databaseId={databaseId}>
        <Button size="small" disabled={isExternalDatabase} variant="outline" icon={<Import />}>
          {t('ugc-page.table-data.detail.header.import.label')}
        </Button>
      </ImportTableData>
      <CreateTable databaseId={databaseId}>
        <Button size="small" disabled={isExternalDatabase} variant="outline" icon={<Plus />}>
          {t('ugc-page.table-data.detail.header.create.label')}
        </Button>
      </CreateTable>
    </header>
  );
};
