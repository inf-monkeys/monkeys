import { useState } from 'react';

import type { EventEmitter } from 'ahooks/lib/useEventEmitter';
import { CopyIcon, SparklesIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import type { TTabularEvent } from '@/components/layout/workspace/vines-view/form/tabular/render';
import { Button } from '@/components/ui/button';
import { useCopy } from '@/hooks/use-copy';

import { processInputsToCopyValue } from '../../workspace/vines-view/form/execution-result/virtua/item/wrapper/raw-data-dialog';

interface TabularFooterButtonsProps {
  processedInputs: any[];
  event$?: EventEmitter<TTabularEvent> | null;
}

export const TabularFooterButtons: React.FC<TabularFooterButtonsProps> = ({ processedInputs, event$ }) => {
  const { t } = useTranslation();
  const { copy } = useCopy();
  const [loading, setLoading] = useState(false);

  // 生成按钮通过事件触发提交
  const handleGenerate = () => {
    if (!event$) return;
    setLoading(true);
    event$.emit('submit');
    setTimeout(() => setLoading(false), 400);
  };

  // 复制当前表单参数
  const handleCopy = () => {
    if (!event$) return;
    event$.emit({
      type: 'get-values',
      callback: (values: Record<string, any>) => {
        const data = processInputsToCopyValue(processedInputs, values);
        copy(JSON.stringify({ type: 'input-parameters', data }));
        toast.success(t('workspace.pre-view.actuator.detail.form-render.actions.copy-input-success'));
      },
    } as any);
  };

  return (
    <div className="z-10 flex w-full items-center justify-center gap-2 bg-background dark:bg-[#111113]">
      <Button icon={<CopyIcon />} variant="outline" onClick={handleCopy} className="text-base">
        {t('workspace.pre-view.actuator.detail.form-render.actions.copy-input', '复制输入')}
      </Button>
      <Button
        icon={<SparklesIcon className="fill-white" />}
        variant="solid"
        className="w-full text-base"
        onClick={handleGenerate}
        loading={loading}
      >
        {t('workspace.pre-view.actuator.execution.label', '生成')}
      </Button>
    </div>
  );
};
