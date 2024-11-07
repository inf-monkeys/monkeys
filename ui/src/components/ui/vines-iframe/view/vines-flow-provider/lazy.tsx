import React, { useMemo } from 'react';

import { useTranslation } from 'react-i18next';

import { IVinesFlowProviderProps } from '@/components/ui/vines-iframe/view/vines-flow-provider/index.tsx';
import { createVinesCore } from '@/package/vines-flow';

const VinesFlowProvider: React.FC<IVinesFlowProviderProps> = ({ workflowId, children }) => {
  const { i18n } = useTranslation();

  const Wrapper = useMemo(() => {
    const { VinesProvider } = createVinesCore(workflowId, i18n);

    return VinesProvider;
  }, [workflowId]);

  return Wrapper({ children });
};

export default VinesFlowProvider;
