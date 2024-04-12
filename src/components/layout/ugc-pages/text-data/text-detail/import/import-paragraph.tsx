import React, { useState } from 'react';

import { useSWRConfig } from 'swr';

import { toast } from 'sonner';

import { useAddVectorData } from '@/apis/vector';
import { ParagraphEditor } from '@/components/layout/ugc-pages/text-data/text-detail/paragraph-editor.tsx';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label.tsx';

interface IImportParagraphProps extends React.ComponentPropsWithoutRef<'div'> {
  textId: string;
  batch?: boolean;
}

export const ImportParagraph: React.FC<IImportParagraphProps> = ({ textId, children, batch = false }) => {
  const { mutate } = useSWRConfig();
  const { trigger } = useAddVectorData(textId);

  const [delimiter, setDelimiter] = useState('\\n');
  const [visible, setVisible] = useState(false);

  const onConfirm = (paragraph: string, metadata: Record<string, unknown>) => {
    toast.promise(trigger({ text: paragraph, metadata, collectionName: textId, ...(batch ? { delimiter } : {}) }), {
      loading: '正在导入段落',
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
          2000,
        );
        return '导入成功，后台向量化时数据更新可能会有延迟';
      },
      error: '导入失败',
    });
  };

  return (
    <ParagraphEditor
      visible={visible}
      setVisibility={setVisible}
      title={batch ? '批量导入段落' : '导入段落'}
      extra={
        batch && (
          <div className="mt-2 flex flex-col gap-2">
            <Label>批量导入段落分割符</Label>
            <Input placeholder="请输入段落分隔符" value={delimiter} onChange={setDelimiter} />
            <p className="text-xs text-muted-foreground">
              将段落内容按照指定分隔符分割，每个段落将被视为一个独立的段落
            </p>
          </div>
        )
      }
      onConfirm={onConfirm}
    >
      {children}
    </ParagraphEditor>
  );
};
