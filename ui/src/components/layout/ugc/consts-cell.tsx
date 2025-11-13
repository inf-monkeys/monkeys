import { I18nValue } from '@inf-monkeys/monkeys';
import { CellContext, ColumnDefTemplate } from '@tanstack/table-core';

import { useSystemConfig } from '@/apis/common';
import { getI18nContent } from '@/utils';

export const DefaultTitleCell: ColumnDefTemplate<CellContext<any, any>> = ({ row, getValue }) => {
  const { data: oem } = useSystemConfig();
  const style =
    oem?.theme.id === 'haier'
      ? {
          fontSize: '14px',
          fontWeight: 900,
          lineHeight: '18px',
        }
      : undefined;
  return (
    <span style={style} className="hover:text-primary-500 transition-colors">
      {getI18nContent(getValue() as string | I18nValue)}
    </span>
  );
};
