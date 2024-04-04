import React from 'react';

import { Play } from 'lucide-react';

import { Button } from '@/components/ui/button';

interface IEmptyInputProps {
  disabled: boolean;
  onClick: () => void;
}

export const EmptyInput: React.FC<IEmptyInputProps> = ({ disabled, onClick }) => {
  return (
    <div className="flex">
      <div className="vines-center flex-1">
        <p className="text-sm text-gray-10">暂未配置输入，可直接运行</p>
      </div>
      <Button disabled={disabled} variant="outline" icon={<Play />} onClick={() => onClick()}>
        运行
      </Button>
    </div>
  );
};
