import { useState } from 'react';

import { isBoolean } from 'lodash';
import { CopyIcon, SparklesIcon } from 'lucide-react';
import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { useSystemConfig } from '@/apis/common';
import { Button } from '@/components/ui/button';
import { useCopy } from '@/hooks/use-copy';
import { useVinesFlow } from '@/package/vines-flow';

interface TabularFooterButtonsProps {
  processedInputs: any[];
}

export const TabularFooterButtons: React.FC<TabularFooterButtonsProps> = ({ processedInputs }) => {
  const { t } = useTranslation();
  const { copy } = useCopy();
  const { vines } = useVinesFlow();
  const { data: oem } = useSystemConfig();
  const [loading, setLoading] = useState(false);
  const form = useFormContext();

  // 生成按钮通过事件触发提交
  const handleGenerate = () => {
    form.handleSubmit(async (values) => {
      setLoading(true);
      try {
        await vines.start({ inputData: values, onlyStart: true });
        if (
          !isBoolean(oem?.theme?.views?.form?.toast?.afterCreate) ||
          oem?.theme?.views?.form?.toast?.afterCreate != false
        )
          toast.success(t('workspace.pre-view.actuator.execution.workflow-execution-created'));
      } catch (error) {
        // console.error('生成失败:', error);
        toast.error(t('workspace.pre-view.actuator.execution.error'));
      } finally {
        setLoading(false);
      }
    })();
  };

  // 复制当前表单参数
  const handleCopy = () => {
    const values = form.getValues();
    const data = processedInputs.map((input) => ({
      id: input.name,
      displayName: input.displayName,
      description: input.description,
      data: values[input.name],
      type: input.type,
    }));
    copy(JSON.stringify({ type: 'input-parameters', data }));
    toast.success(t('workspace.pre-view.actuator.detail.form-render.actions.copy-input-success'));
  };

  return (
    <div className="z-10 flex w-full items-center justify-center gap-2 bg-background py-3 dark:bg-[#111113] sm:gap-1 md:gap-2">
      <Button icon={<CopyIcon />} variant="outline" size="small" onClick={handleCopy} className="text-base">
        {t('workspace.pre-view.actuator.detail.form-render.actions.copy-input', '复制输入')}
      </Button>
      <Button
        icon={<SparklesIcon className="fill-white" />}
        variant="solid"
        size="small"
        className="text-base"
        onClick={handleGenerate}
        loading={loading}
      >
        {t('workspace.pre-view.actuator.execution.label', '生成')}
      </Button>
    </div>
  );
};
