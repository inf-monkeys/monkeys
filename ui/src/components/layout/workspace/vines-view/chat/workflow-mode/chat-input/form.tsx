import React from 'react';

import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

import { TabularRender } from '@/components/layout/workspace/vines-view/form/tabular/render';
import { Button } from '@/components/ui/button';
import { useElementSize } from '@/hooks/use-resize-observer.ts';
import { VinesWorkflowVariable } from '@/package/vines-flow/core/tools/typings.ts';
import { cn } from '@/utils';

interface IFormInputProps {
  height: number;
  inputs: VinesWorkflowVariable[];
  onClick: () => void;
  disabled?: boolean;
}

export const FormInput: React.FC<IFormInputProps> = ({ inputs, height, onClick, disabled }) => {
  const { t } = useTranslation();

  const { ref, width } = useElementSize();

  return (
    <motion.div
      ref={ref}
      className={cn('w-2/6 max-w-80 overflow-hidden px-3', disabled && 'pointer-events-none opacity-85')}
      animate={{ marginRight: disabled ? -width - 35 : 0 }}
    >
      <TabularRender inputs={inputs} height={height} onSubmit={onClick} miniMode>
        <Button variant="outline" type="submit" className="line-clamp-1" loading={disabled}>
          {t('workspace.chat-view.workflow-mode.execution')}
        </Button>
      </TabularRender>
    </motion.div>
  );
};
