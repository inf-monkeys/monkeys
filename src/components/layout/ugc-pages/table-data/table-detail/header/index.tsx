import React from 'react';

import { Import, Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';

interface ITableDetailHeaderProps {
  databaseId: string;
}

export const TableDetailHeader: React.FC<ITableDetailHeaderProps> = ({ databaseId }) => {
  return (
    <header className="flex w-full items-center justify-end gap-4 px-4 py-2">
      <Button variant="outline" icon={<Import />}>
        导入数据
      </Button>
      <Button variant="outline" icon={<Plus />}>
        创建表
      </Button>
    </header>
  );
};
