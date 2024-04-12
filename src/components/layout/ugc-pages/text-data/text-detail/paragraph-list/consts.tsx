import React from 'react';

import { ColumnDef } from '@tanstack/react-table';
import { Trash2 } from 'lucide-react';

import { IVectorRecord } from '@/apis/vector/typings.ts';
import { Button } from '@/components/ui/button';

export const columns: ColumnDef<IVectorRecord>[] = [
  {
    id: 'rank',
    header: '相似度排名',
    size: 32,
    cell: ({ row }) => <span>{row.index + 1}</span>,
  },
  {
    accessorKey: '_source.page_content',
    header: '文本',
    id: 'text',
    cell: ({ cell }) => {
      const text = (cell.getValue() as string) ?? '';
      return <span>{text?.length > 200 ? text.slice(0, 200) + '...' : text}</span>;
    },
  },
  {
    accessorKey: '_source.page_content',
    header: '字符数',
    id: 'charCount',
    size: 24,
    cell: ({ cell }) => <span>{(cell.getValue() as string)?.length}</span>,
  },
  {
    id: 'operate',
    header: '操作',
    size: 64,
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <Button size="small" variant="outline">
          编辑
        </Button>
        <Button className="[&_svg]:stroke-red-10" size="small" variant="outline" icon={<Trash2 />} />
      </div>
    ),
  },
];
