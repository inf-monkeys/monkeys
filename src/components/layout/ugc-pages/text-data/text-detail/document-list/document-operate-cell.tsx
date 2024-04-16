import React, { useState } from 'react';

import { useSWRConfig } from 'swr';

import { CellContext } from '@tanstack/table-core';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { deleteKnowledgeBaseDocument } from '@/apis/vector';
import { IKnowledgeBaseDocument } from '@/apis/vector/typings.ts';
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
import { Route } from '@/pages/$teamId/text-data/$textId';

interface IParagraphOperateCellProps extends CellContext<IKnowledgeBaseDocument, unknown> {}

export const DocumentOperateCell: React.FC<IParagraphOperateCellProps> = ({ cell }) => {
  const { textId } = Route.useParams();
  const { mutate } = useSWRConfig();

  const [visible, setVisible] = useState(false);
  const value = (cell.getValue() as IKnowledgeBaseDocument) ?? {};

  const handleDelete = () => {
    toast.promise(deleteKnowledgeBaseDocument(textId, value.id), {
      loading: '删除中',
      success: () => {
        setVisible(false);
        setTimeout(
          () =>
            mutate(
              (key) =>
                (typeof key === 'string' &&
                  key.startsWith(`/api/tools/monkey_tools_knowledge_base/knowledge-bases/${textId}`)) ||
                (Array.isArray(key) &&
                  key.some(
                    (k) =>
                      typeof k === 'string' &&
                      k.startsWith(`/api/tools/monkey_tools_knowledge_base/knowledge-bases/${textId}`),
                  )),
            ),
          500,
        );
        return '删除成功';
      },
      error: '删除失败',
    });
  };

  return (
    <div className="flex items-center gap-2">
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button className="[&_svg]:stroke-red-10" size="small" variant="outline" icon={<Trash2 />} />
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确定要删除此文档吗</AlertDialogTitle>
            <AlertDialogDescription>
              删除此文档将会删除此文档关联的段落，数据不可恢复，请谨慎操作
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>删除</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
