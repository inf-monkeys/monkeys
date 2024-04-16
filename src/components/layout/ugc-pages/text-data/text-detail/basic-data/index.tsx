import React, { useEffect, useState } from 'react';

import { Edit2Icon } from 'lucide-react';
import { toast } from 'sonner';

import { useKnowledgeBase, useUpdateKnowledgeBase } from '@/apis/vector';
import { ICreateVectorDB } from '@/apis/vector/typings.ts';
import { InfoEditor } from '@/components/layout/settings/account/info-editor.tsx';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table.tsx';
import { VinesIconEditor } from '@/components/ui/vines-icon/editor.tsx';
import { formatTimeDiffPrevious } from '@/utils/time.ts';

interface IBasicInfoProps {
  textId: string;
}

export const BasicInfo: React.FC<IBasicInfoProps> = ({ textId }) => {
  const { data: detail, mutate } = useKnowledgeBase(textId);
  const { trigger } = useUpdateKnowledgeBase(detail?.name ?? '');

  const handleUpdate = (key: string, val: string) => {
    toast.promise(
      trigger({ [key]: val } as unknown as Pick<ICreateVectorDB, 'displayName' | 'description' | 'iconUrl'>),
      {
        loading: '更新中...',
        success: () => {
          void mutate();
          return '更新成功！';
        },
        error: '更新失败！请稍后再重试',
      },
    );
  };

  const [icon, setIcon] = useState(detail?.iconUrl || 'emoji:🍀:#ceefc5');
  useEffect(() => {
    setIcon(detail?.iconUrl || 'emoji:🍀:#ceefc5');
  }, [detail?.iconUrl]);

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-32">类型</TableHead>
          <TableHead>内容</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell>图标</TableCell>
          <TableCell>
            <VinesIconEditor
              value={icon}
              defaultValue={detail?.iconUrl}
              onChange={setIcon}
              onFinished={(val) => handleUpdate('iconUrl', val)}
              size="sm"
            />
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell>名称</TableCell>
          <TableCell className="flex items-center gap-2">
            <span>{detail?.displayName}</span>
            <InfoEditor
              title="编辑名称"
              placeholder="输入名称，16 字以内"
              initialValue={detail?.displayName || ''}
              onFinished={(val) => handleUpdate('displayName', val)}
            >
              <Button variant="outline" size="small" icon={<Edit2Icon />} className="scale-80">
                编辑
              </Button>
            </InfoEditor>
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell>描述</TableCell>
          <TableCell className="flex items-center gap-2">
            <span>{detail?.description || '暂无描述'}</span>
            <InfoEditor
              title="编辑描述"
              placeholder="输入描述，120 字以内"
              initialValue={detail?.description || ''}
              onFinished={(val) => handleUpdate('description', val)}
            >
              <Button variant="outline" size="small" icon={<Edit2Icon />} className="scale-80">
                编辑
              </Button>
            </InfoEditor>
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell>向量维度</TableCell>
          <TableCell>{detail?.dimension || '-'}</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Embedding 模型</TableCell>
          <TableCell>{detail?.embeddingModel || '-'}</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>创建时间</TableCell>
          <TableCell>{formatTimeDiffPrevious(detail?.createdTimestamp ?? 0)}</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>最后更新时间</TableCell>
          <TableCell>{formatTimeDiffPrevious(detail?.updatedTimestamp ?? 0)}</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );
};
