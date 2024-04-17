import React, { useEffect, useState } from 'react';

import { useSWRConfig } from 'swr';

import { ColumnDef } from '@tanstack/react-table';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { deleteTable, useDatabaseData } from '@/apis/table-data';
import { IDatabaseData } from '@/apis/table-data/typings.ts';
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

interface ITableDatabaseProps {
  databaseId: string;
  tableId: string;
}

export const TableDatabase: React.FC<ITableDatabaseProps> = ({ databaseId, tableId }) => {
  const { mutate } = useSWRConfig();

  const [page, setPage] = useState(1);
  const { data, isLoading } = useDatabaseData(databaseId, tableId, page);

  const [columns, setColumns] = useState<ColumnDef<IDatabaseData>[]>([]);
  const [colKeys, setColKeys] = useState<string[]>([]);

  const [dataList, setDataList] = useState<IDatabaseData[]>([]);

  const [query, setQuery] = useState<string>('');

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
        void mutate((key) => typeof key === 'string' && key.startsWith(`/api/database/${databaseId}/tables`));
        return '表格数据删除成功';
      },
      error: '表格数据删除失败',
    });
  };

  const colKeysLength = colKeys.length;

  return (
    <>
      <div className="mb-4 flex items-center gap-2">
        <Input placeholder="输入关键词基于当前已加载的数据搜索" value={query} onChange={setQuery} />
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button className="text-red-10 [&_svg]:stroke-red-10" variant="outline" icon={<Trash2 />}>
              删除表格
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>确定要删除该表数据吗？</AlertDialogTitle>
              <AlertDialogDescription>删除后，该表数据将无法恢复，其中的数据也将被永久删除。</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>取消</AlertDialogCancel>
              <AlertDialogAction onClick={handelDelete}>删除</AlertDialogAction>
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
                  {isEmpty && !isLoading ? '数据已全部加载' : '加载更多'}
                </Button>
              </td>
            </tr>
          </tfoot>
        }
      />
    </>
  );
};
