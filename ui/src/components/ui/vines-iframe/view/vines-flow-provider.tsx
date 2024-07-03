import React, { useMemo } from 'react';

import { useTranslation } from 'react-i18next';

import { createVinesCore } from '@/package/vines-flow';

interface IVinesFlowProviderProps {
  workflowId: string;
  children: React.ReactNode;
}

export const VinesFlowProvider: React.FC<IVinesFlowProviderProps> = ({ workflowId, children }) => {
  const { i18n } = useTranslation();

  const Wrapper = useMemo(() => {
    const { VinesProvider } = createVinesCore(workflowId, i18n);

    return VinesProvider;
  }, [workflowId]);

  return Wrapper({ children });
};
