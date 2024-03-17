import React, { useCallback } from 'react';

import { ColumnDef } from '@tanstack/react-table';

import { IAssetItem } from '@/apis/ugc/typings.ts';
import { Card, CardContent } from '@/components/ui/card.tsx';
import { VinesIcon } from '@/components/ui/vines-icon';
import _ from 'lodash';

interface IUgcViewCardProps<E extends object> {
  data: IAssetItem<E>;
  index: number;
}

export const UgcViewCard = <E extends object>({ data, index }: IUgcViewCardProps<E>) => {
  console.log(data);

  const renderUgcColumn = useCallback(
    (column?: ColumnDef<IAssetItem<E>>) => {
      const text = _.get(data, column?.);
      const el: React.ReactNode = column?.render ? column.render(text, data, index) : text;
      return el;
    },
    [index, data],
  );
  return (
    <Card>
      <CardContent>
        <VinesIcon size="sm"></VinesIcon>
      </CardContent>
    </Card>
  );
};
