import React from 'react';

import { VinesWorkflowExecutionStatData } from '@/apis/workflow/execution/typings.ts';

interface IVinesLogViewStatTableProps {
  searchWorkflowExecutionStatData?: VinesWorkflowExecutionStatData[];
  handleSubmit: () => void;
}

export const VinesLogViewStatTable: React.FC<IVinesLogViewStatTableProps> = ({ searchWorkflowExecutionStatData }) => {
  return <></>;
};
