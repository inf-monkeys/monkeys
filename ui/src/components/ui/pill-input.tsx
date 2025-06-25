import React, { useRef, useState } from 'react';

import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { cn } from '@/utils';

interface PillInputProps {
  value?: (string | number | boolean)[];
  onChange: (values: (string | number | boolean)[]) => void;
  placeholder?: string;
  fieldType?: 'string' | 'number' | 'boolean';
  disabled?: boolean;
  className?: string;
}

/**
 * 根据字段类型转换值
 */
const convertValueByType = (value: string, type: string): string | number | boolean => {
  switch (type) {
    case 'number': {
      const num = Number(value);
      return isNaN(num) ? value : num;
    }
    case 'boolean': {
      const lowerValue = value.toLowerCase().trim();
      return ['true', 'yes', '是', '1'].includes(lowerValue);
    }
    default:
      return value;
  }
};

/**
 * 验证值是否有效
 */
const isValidValue = (value: string, type: string): boolean => {
  if (!value.trim()) return false;

  switch (type) {
    case 'number':
      return !isNaN(Number(value));
    case 'boolean': {
      const lowerValue = value.toLowerCase().trim();
      return ['true', 'false', 'yes', 'no', '是', '否', '1', '0'].includes(lowerValue);
    }
    default:
      return true;
  }
};

/**
 * 获取字段类型的占位符提示
 */
const getTypePlaceholder = (fieldType: string, t: any): string => {
  switch (fieldType) {
    case 'number':
      return t('workspace.flow-view.endpoint.start-tool.input.config-form.visibility.pill-input.placeholder-number');
    case 'boolean':
      return t('workspace.flow-view.endpoint.start-tool.input.config-form.visibility.pill-input.placeholder-boolean');
    default:
      return t('workspace.flow-view.endpoint.start-tool.input.config-form.visibility.pill-input.placeholder-string');
  }
};

export const PillInput: React.FC<PillInputProps> = ({
  value = [],
  onChange,
  placeholder,
  fieldType = 'string',
  disabled = false,
  className,
}) => {
  const { t } = useTranslation();
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const addPill = (newValue: string) => {
    const trimmedValue = newValue.trim();
    if (!trimmedValue) return;

    // 验证值的有效性
    if (!isValidValue(trimmedValue, fieldType)) {
      // 静默忽略无效值
      return;
    }

    // 检查是否已存在
    const convertedValue = convertValueByType(trimmedValue, fieldType);
    if (value.some((v) => v === convertedValue)) return;

    onChange([...value, convertedValue]);
    setInputValue('');
  };

  const removePill = (indexToRemove: number) => {
    if (disabled) return;
    onChange(value.filter((_, i) => i !== indexToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addPill(inputValue);
    } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      // 删除最后一个 pill
      removePill(value.length - 1);
    } else if (e.key === 'Escape') {
      inputRef.current?.blur();
    }
  };

  const finalPlaceholder = placeholder || getTypePlaceholder(fieldType, t);

  return (
    <div
      className={cn(
        'flex min-h-10 w-full flex-wrap items-center gap-1.5 rounded-md border border-input bg-[#FFFFFF] px-3 py-2 text-sm dark:bg-[#111113]',
        disabled && 'cursor-not-allowed opacity-50',
        className,
      )}
      onClick={(e) => {
        if (!disabled) {
          const input = e.currentTarget.querySelector('input');
          input?.focus();
        }
      }}
    >
      {value
        .filter((pill) => pill !== undefined && pill !== null && pill !== '')
        .map((pill, index) => (
          <Badge
            key={index}
            variant="secondary"
            className={cn('flex items-center gap-1 py-1 text-xs', !disabled && 'hover:bg-secondary/80')}
          >
            <span>{String(pill)}</span>
            {!disabled && (
              <X
                size={12}
                className="cursor-pointer hover:text-foreground"
                onClick={(e) => {
                  e.stopPropagation();
                  removePill(index);
                }}
              />
            )}
          </Badge>
        ))}

      <Input
        ref={inputRef}
        value={inputValue}
        onChange={setInputValue}
        onKeyDown={handleKeyDown}
        placeholder={value.length === 0 ? finalPlaceholder : ''}
        disabled={disabled}
        className="h-auto min-w-20 flex-1 border-0 bg-transparent p-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
      />
    </div>
  );
};
