import React from 'react';

import { Ellipsis } from 'lucide-react';

import { IVinesExecutionResultItem } from '@/components/layout/workspace/vines-view/form/execution-result/virtua/item';
import { VirtuaExecutionResultRawDataDialog } from '@/components/layout/workspace/vines-view/form/execution-result/virtua/item/wrapper/raw-data-dialog.tsx';
import { Button } from '@/components/ui/button';

interface IVirtuaExecutionResultGridWrapperProps {
  data: IVinesExecutionResultItem;
  children: React.ReactNode;
}

export const VirtuaExecutionResultGridWrapper: React.FC<IVirtuaExecutionResultGridWrapperProps> = ({
  data,
  children,
}) => {
  return (
    <div className="group/vgi relative">
      {children}
      <VirtuaExecutionResultRawDataDialog data={data}>
        <Button
          className="absolute right-2 top-2 rounded !p-1 opacity-0 transition-opacity group-hover/vgi:opacity-100 [&_svg]:!size-3"
          icon={<Ellipsis />}
          variant="outline"
          size="small"
        />
      </VirtuaExecutionResultRawDataDialog>
    </div>
  );
};
