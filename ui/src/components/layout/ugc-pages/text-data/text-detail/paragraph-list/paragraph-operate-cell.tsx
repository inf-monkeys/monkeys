import React, { useState } from 'react';

import { useSWRConfig } from 'swr';

import { CellContext } from '@tanstack/table-core';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { deleteSegment, updateSegment } from '@/apis/vector';
import { IVectorRecord } from '@/apis/vector/typings.ts';
import { ParagraphEditor } from '@/components/layout/ugc-pages/text-data/text-detail/paragraph-editor.tsx';
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

interface IParagraphOperateCellProps extends CellContext<IVectorRecord, unknown> {}

export const ParagraphOperateCell: React.FC<IParagraphOperateCellProps> = ({ cell }) => {
  const { textId } = Route.useParams();
  const { mutate } = useSWRConfig();

  const [visible, setVisible] = useState(false);
  const value = (cell.getValue() as IVectorRecord) ?? {};

  const handleOnConfirm = (paragraph: string, metadata: Record<string, unknown>) => {
    toast.promise(updateSegment(textId, value.pk, { text: paragraph, metadata }), {
      loading: '更新中',
      success: () => {
        setVisible(false);
        setTimeout(
          () => mutate((key) => typeof key === 'string' && key.startsWith(`/api/vector/collections/${textId}`)),
          1000,
        );
        return '更新成功，后台向量化时数据更新可能会有延迟';
      },
      error: '更新失败',
    });
  };

  const handleDelete = () => {
    toast.promise(deleteSegment(textId, value.pk), {
      loading: '删除中',
      success: () => {
        setVisible(false);
        setTimeout(
          () =>
            mutate(
              (key) =>
                (typeof key === 'string' && key.startsWith(`/api/vector/collections/${textId}`)) ||
                (Array.isArray(key) &&
                  key.some((k) => typeof k === 'string' && k.startsWith(`/api/vector/collections/${textId}`))),
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
      <ParagraphEditor
        visible={visible}
        setVisibility={setVisible}
        paragraph={value?.page_content ?? ''}
        metadata={value?.metadata ?? {}}
        onConfirm={handleOnConfirm}
      >
        <Button size="small" variant="outline">
          编辑
        </Button>
      </ParagraphEditor>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button className="[&_svg]:stroke-red-10" size="small" variant="outline" icon={<Trash2 />} />
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确定要删除此段落吗</AlertDialogTitle>
            <AlertDialogDescription>确认删除该段落吗，删除后不可被索引，该操作不可恢复！</AlertDialogDescription>
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
