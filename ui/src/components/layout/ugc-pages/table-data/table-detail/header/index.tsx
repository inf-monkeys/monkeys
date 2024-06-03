import React from 'react';

import { useSWRConfig } from 'swr';

import { Import, Plus, RefreshCwIcon } from 'lucide-react';
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
  const { mutate } = useSWRConfig();
  const databaseId = database?.uuid;
  const isExternalDatabase = database?.createType === SqlKnowledgeBaseCreateType.external;

  const handleRefresh = () => {
    toast.promise(
      mutate((key) => typeof key === 'string' && key.startsWith(`/api/sql-knowledge-bases/${databaseId}/tables`)),
      {
        loading: '正在刷新数据',
        success: '刷新成功',
        error: '刷新失败',
      },
    );
  };

  return (
    <header className="flex w-full items-center justify-end gap-4 px-4 py-2">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline" icon={<RefreshCwIcon />} onClick={handleRefresh} />
        </TooltipTrigger>
        <TooltipContent>刷新数据</TooltipContent>
      </Tooltip>
      <ImportTableData databaseId={databaseId}>
        <Button disabled={isExternalDatabase} variant="outline" icon={<Import />}>
          导入数据
        </Button>
      </ImportTableData>
      <CreateTable databaseId={databaseId}>
        <Button disabled={isExternalDatabase} variant="outline" icon={<Plus />}>
          创建表
        </Button>
      </CreateTable>
    </header>
  );
};
