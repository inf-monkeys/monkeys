import React, { useEffect, useState } from 'react';

import { useSWRConfig } from 'swr';

import { ColumnDef } from '@tanstack/react-table';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { deleteTable, useDatabaseData } from '@/apis/table-data';
import { IDatabaseData, ITableData, SqlKnowledgeBaseCreateType } from '@/apis/table-data/typings.ts';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog.tsx';
import { Button } from '@/components/ui/button';
import { InfiniteScrollingDataTable } from '@/components/ui/data-table/infinite.tsx';
import { Input } from '@/components/ui/input';
import { useTranslation } from 'react-i18next';
import { getI18nContent } from '@/utils';

interface ITableDatabaseProps {
  database: ITableData;
  tableId: string;
}

export const TableDatabase: React.FC<ITableDatabaseProps> = ({ database, tableId }) => {
  const { t } = useTranslation();
  const { mutate } = useSWRConfig();
  const isExternalDatabase = database?.createType === SqlKnowledgeBaseCreateType.external;
  const databaseId = database?.uuid;
  const [page, setPage] = useState(1);
  const { data, isLoading } = useDatabaseData(databaseId, tableId, page);

  const [columns, setColumns] = useState<ColumnDef<IDatabaseData>[]>([]);
  const [colKeys, setColKeys] = useState<string[]>([]);

  const [dataList, setDataList] = useState<IDatabaseData[]>([]);

  const [query, setQuery] = useState<string>('');

  const displayName = database.displayName;

  const isEmpty = !data?.length;
  useEffect(() => {
    if (isEmpty) return;

    setDataList((prev) => [...prev, ...data]);

    if (!columns.length) {
      const keys = Object.keys(data[0]);
      setColKeys(keys);
      setColumns(
        keys.map((key, i) => ({
          accessorKey: key,
          header: key,
          id: key,
          cell: ({ cell }) => <span>{(cell.getValue() as string) || '-'}</span>,
          ...(i ? {} : { size: 32 }),
        })),
      );
    }
  }, [data]);

  const handelDelete = () => {
    toast.promise(deleteTable(databaseId, tableId), {
      loading: '正在删除表格数据...',
      success: () => {
        void mutate(
          (key) => typeof key === 'string' && key.startsWith(`/api/sql-knowledge-bases/${databaseId}/tables`),
        );
        return '表格数据删除成功';
      },
      error: '表格数据删除失败',
    });
  };

  const colKeysLength = colKeys.length;

  return (
    <>
      <div className="mb-4 flex items-center gap-2">
        <Input
          placeholder={t('ugc-page.table-data.detail.data.search.placeholder')}
          value={query}
          onChange={setQuery}
        />
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              disabled={isExternalDatabase}
              className="text-red-10 [&_svg]:stroke-red-10"
              variant="outline"
              icon={<Trash2 />}
            >
              {t('ugc-page.table-data.detail.data.delete.label')}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {t('common.dialog.delete-confirm.title', {
                  type: t('common.type.table-data'),
                })}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {t('common.dialog.delete-confirm.content', {
                  type: t('common.type.table-data'),
                  name: displayName ? getI18nContent(displayName) : t('common.utils.unknown'),
                })}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('common.utils.cancel')}</AlertDialogCancel>
              <AlertDialogAction onClick={handelDelete}>{t('common.utils.confirm')}</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
      <InfiniteScrollingDataTable
        className="h-5/6"
        columns={columns}
        data={dataList.filter((it) => {
          if (!query) return true;
          for (let i = 0; i < colKeysLength; i++) {
            if (it[colKeys[i]].toString().includes(query)) return true;
          }
          return false;
        })}
        loading={isLoading}
        tfoot={
          <tfoot className="relative">
            <tr>
              <td className="absolute w-full py-4 text-center">
                <Button
                  disabled={isEmpty}
                  variant="outline"
                  size="small"
                  loading={isLoading}
                  onClick={() => setPage((prev) => prev + 1)}
                >
                  {isEmpty && !isLoading ? t('common.utils.all-loaded') : t('common.utils.load-more')}
                </Button>
              </td>
            </tr>
          </tfoot>
        }
      />
    </>
  );
};
