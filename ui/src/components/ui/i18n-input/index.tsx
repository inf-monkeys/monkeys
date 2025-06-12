import React, { useEffect, useState } from 'react';

import { EditIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { LANGUAGES_LIST } from '@/components/ui/i18n-selector/consts';
import { Input } from '@/components/ui/input';

// 语言映射：前端使用的语言代码 -> i18n 标准代码
export const LANGUAGE_MAPPER = {
  en: 'en-US',
  zh: 'zh-CN',
};

interface II18nInputProps {
  value?: string | Record<string, string>;
  onChange?: (value: string | Record<string, string>) => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
  dialogTitle?: string;
}

export const I18nInput: React.FC<II18nInputProps> = ({
  value,
  onChange,
  placeholder,
  className,
  autoFocus,
  dialogTitle = 'Edit i18n Text',
}) => {
  const { t, i18n } = useTranslation();

  // 当前语言对应的 i18n 键
  const currentLanguageKey = LANGUAGE_MAPPER[i18n.language as keyof typeof LANGUAGE_MAPPER] || 'en-US';

  // 内部状态管理 i18n 数据
  const [i18nData, setI18nData] = useState<Record<string, string>>({});
  const [dialogOpen, setDialogOpen] = useState(false);

  // 初始化 i18n 数据
  useEffect(() => {
    if (typeof value === 'string') {
      // 将旧的字符串格式转换为 i18n 对象，但不触发onChange
      const i18nObj = { [currentLanguageKey]: value };
      setI18nData(i18nObj);
    } else if (value && typeof value === 'object') {
      setI18nData(value);
    } else {
      setI18nData({});
    }
  }, [value, currentLanguageKey]); // 重新添加currentLanguageKey依赖，但避免触发onChange

  // 获取当前语言的显示值
  const getCurrentLanguageValue = (i18nDataObj: Record<string, string>) => {
    // 优先显示当前语言的值
    if (i18nDataObj[currentLanguageKey]) {
      return i18nDataObj[currentLanguageKey];
    }
    // 如果当前语言没有值，显示第一个有值的语言
    const firstValue = Object.values(i18nDataObj).find((v) => v && v.trim().length > 0);
    return firstValue || '';
  };

  // 监听语言变化，确保显示值正确更新
  const displayValue = getCurrentLanguageValue(i18nData);

  // 主输入框值变化处理
  const handleMainInputChange = (inputValue: string) => {
    const newI18nData = { ...i18nData, [currentLanguageKey]: inputValue };
    setI18nData(newI18nData);

    // 如果所有语言都为空，保存空字符串触发验证
    const hasAnyValue = Object.values(newI18nData).some((v) => v && v.trim().length > 0);
    onChange?.(hasAnyValue ? newI18nData : '');
  };

  // Dialog 中特定语言的值变化处理
  const handleLanguageValueChange = (languageKey: string, inputValue: string) => {
    const newI18nData = { ...i18nData, [languageKey]: inputValue };
    setI18nData(newI18nData);
  };

  // Dialog 保存处理
  const handleSave = () => {
    // 过滤掉空值
    const filteredData = Object.fromEntries(
      Object.entries(i18nData).filter(([_, val]) => val && val.trim().length > 0),
    );

    // 如果过滤后没有任何值，保存空字符串以触发验证错误
    // 否则保存 i18n 对象
    const hasAnyValue = Object.keys(filteredData).length > 0;
    onChange?.(hasAnyValue ? filteredData : '');
    setDialogOpen(false);
  };

  // Dialog关闭处理 - 自动保存更改
  const handleDialogOpenChange = (open: boolean) => {
    if (!open) {
      // 关闭Dialog时自动保存
      handleSave();
    } else {
      setDialogOpen(open);
    }
  };

  return (
    <div className="relative">
      <Input
        placeholder={placeholder}
        value={displayValue}
        onChange={(inputValue: string) => handleMainInputChange(inputValue)}
        className={`pr-14 ${className || ''}`}
        autoFocus={autoFocus}
      />
      <Dialog open={dialogOpen} onOpenChange={handleDialogOpenChange}>
        <DialogTrigger asChild>
          <Button icon={<EditIcon />} variant="outline" size="icon" className="absolute inset-y-1 right-1" />
        </DialogTrigger>
        <DialogContent>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <div className="space-y-6">
            {LANGUAGES_LIST.map(([key, label]) => {
              const languageKey = LANGUAGE_MAPPER[key as keyof typeof LANGUAGE_MAPPER] || key;
              return (
                <div key={languageKey} className="flex flex-col gap-4">
                  <label className="text-xs font-medium text-gray-11" htmlFor={`i18n-input-${languageKey}`}>
                    {label}
                  </label>
                  <Input
                    id={`i18n-input-${languageKey}`}
                    placeholder={placeholder}
                    value={i18nData[languageKey] || ''}
                    onChange={(inputValue: string) => handleLanguageValueChange(languageKey, inputValue)}
                    className="grow"
                  />
                </div>
              );
            })}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleSave}>
              {t('common.utils.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
