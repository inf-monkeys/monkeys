import React from 'react';

import { useElementSize } from '@mantine/hooks';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

import { VinesWorkflowInput } from '@/components/layout/vines-view/execution/workflow-input';
import { Button } from '@/components/ui/button';
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
      className={cn('w-2/6 max-w-80 overflow-hidden', disabled && 'pointer-events-none opacity-85')}
      animate={{ marginRight: disabled ? -width - 35 : 0 }}
    >
      <VinesWorkflowInput inputs={inputs} height={height} onSubmit={onClick}>
        <Button variant="outline" type="submit" className="line-clamp-1" loading={disabled}>
          {t('workspace.chat-view.workflow-mode.execution')}
        </Button>
      </VinesWorkflowInput>
    </motion.div>
  );
};
