import React, { useState } from 'react';

import { useSWRConfig } from 'swr';

import { CellContext } from '@tanstack/table-core';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { updateVectorData } from '@/apis/vector';
import { IVectorRecord } from '@/apis/vector/typings.ts';
import { ParagraphEditor } from '@/components/layout/ugc-pages/text-data/text-detail/paragraph-editor.tsx';
import { Button } from '@/components/ui/button';
import { Route } from '@/pages/$teamId/text-data/$textId';

interface IParagraphOperateCellProps extends CellContext<IVectorRecord, unknown> {}

export const ParagraphOperateCell: React.FC<IParagraphOperateCellProps> = ({ cell }) => {
  const { textId } = Route.useParams();
  const { mutate } = useSWRConfig();

  const [visible, setVisible] = useState(false);
  const value = (cell.getValue() as IVectorRecord) ?? {};

  const handleOnConfirm = (paragraph: string, metadata: Record<string, unknown>) => {
    toast.promise(updateVectorData(textId, value._id, { text: paragraph, metadata }), {
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

  return (
    <div className="flex items-center gap-2">
      <ParagraphEditor
        visible={visible}
        setVisibility={setVisible}
        paragraph={value?._source?.page_content ?? ''}
        metadata={value?._source?.metadata ?? {}}
        onConfirm={handleOnConfirm}
      >
        <Button size="small" variant="outline">
          编辑
        </Button>
      </ParagraphEditor>
      <Button className="[&_svg]:stroke-red-10" size="small" variant="outline" icon={<Trash2 />} />
    </div>
  );
};
