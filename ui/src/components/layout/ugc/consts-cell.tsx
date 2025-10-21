import { I18nValue } from '@inf-monkeys/monkeys';
import { CellContext, ColumnDefTemplate } from '@tanstack/table-core';

import { getI18nContent } from '@/utils';

export const DefaultTitleCell: ColumnDefTemplate<CellContext<any, any>> = ({ row, getValue }) => (
  <span className="hover:text-primary-500 transition-colors">{getI18nContent(getValue() as string | I18nValue)}</span>
);
