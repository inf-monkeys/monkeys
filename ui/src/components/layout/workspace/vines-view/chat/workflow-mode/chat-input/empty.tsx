import React from 'react';

import { Play } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';

interface IEmptyInputProps {
  loading: boolean;
  disabled: boolean;
  onClick: () => void;
}

export const EmptyInput: React.FC<IEmptyInputProps> = ({ disabled, onClick, loading }) => {
  const { t } = useTranslation();

  return (
    <div className="flex">
      <div className="vines-center flex-1">
        <p className="text-sm text-gray-10">
          {disabled
            ? t('workspace.chat-view.workflow-mode.empty-input.running')
            : t('workspace.chat-view.workflow-mode.empty-input.completed')}
        </p>
      </div>
      <Button
        disabled={disabled}
        variant="outline"
        icon={<Play />}
        onClick={() => onClick()}
        loading={loading || disabled}
      >
        {t('workspace.chat-view.workflow-mode.execution')}
      </Button>
    </div>
  );
};
