import { ColumnDef } from '@tanstack/react-table';

import { IKnowledgeBaseDocument } from '@/apis/vector/typings.ts';

import { DocumentOperateCell } from './document-operate-cell';

export const columns: ColumnDef<IKnowledgeBaseDocument>[] = [
  {
    accessorKey: 'id',
    header: '文档 ID',
    id: 'id',
    cell: ({ cell }) => {
      const text = (cell.getValue() as string) ?? '';
      return <span>{text?.length > 200 ? text.slice(0, 200) + '...' : text}</span>;
    },
  },
  {
    accessorKey: 'filename',
    header: '文档名称',
    id: 'filename',
    cell: ({ cell }) => {
      const text = (cell.getValue() as string) ?? '';
      return <span>{text?.length > 200 ? text.slice(0, 200) + '...' : text}</span>;
    },
  },
  {
    accessorKey: 'fileUrl',
    header: '文件链接',
    id: 'fileUrl',
    cell: ({ cell }) => {
      const text = (cell.getValue() as string) ?? '';
      return <span>{text?.length > 200 ? text.slice(0, 200) + '...' : text}</span>;
    },
  },
  {
    accessorKey: 'indexStatus',
    header: '索引状态',
    id: 'indexStatus',
    cell: ({ cell }) => {
      const text = (cell.getValue() as string) ?? '';
      return <span>{text?.length > 200 ? text.slice(0, 200) + '...' : text}</span>;
    },
  },
  {
    accessorKey: 'failedMessage',
    header: '错误信息',
    id: 'failedMessage',
    cell: ({ cell }) => {
      const text = (cell.getValue() as string) ?? '';
      return <span>{text?.length > 200 ? text.slice(0, 200) + '...' : text}</span>;
    },
  },
  {
    accessorFn: (row) => row,
    id: 'operate',
    header: '操作',
    size: 64,
    cell: DocumentOperateCell,
  },
];
