import React, { useEffect, useState } from 'react';

import { EditIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { LANGUAGES_LIST } from '@/components/ui/i18n-selector/consts';
import { Textarea } from '@/components/ui/textarea';

// 语言映射：前端使用的语言代码 -> i18n 标准代码
export const LANGUAGE_MAPPER = {
  en: 'en-US',
  zh: 'zh-CN',
};

interface II18nTextareaProps {
  value?: string | Record<string, string>;
  onChange?: (value: string | Record<string, string>) => void;
  placeholder?: string;
  className?: string;
  dialogTitle?: string;
}

export const I18nTextarea: React.FC<II18nTextareaProps> = ({
  value,
  onChange,
  placeholder,
  className,
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
      // 将旧的字符串格式转换为 i18n 对象
      const i18nObj = { [currentLanguageKey]: value };
      setI18nData(i18nObj);
      // 更新表单数据为 i18n 格式
      onChange?.(i18nObj);
    } else if (value && typeof value === 'object') {
      setI18nData(value);
    } else {
      setI18nData({});
    }
  }, [value, currentLanguageKey]);

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

  // 主输入框值变化处理
  const handleMainInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const inputValue = event.target.value;
    const newI18nData = { ...i18nData, [currentLanguageKey]: inputValue };
    setI18nData(newI18nData);

    // 如果所有语言都为空，保存空字符串触发验证
    const hasAnyValue = Object.values(newI18nData).some((v) => v && v.trim().length > 0);
    onChange?.(hasAnyValue ? newI18nData : '');
  };

  // Dialog 中特定语言的值变化处理
  const handleLanguageValueChange = (languageKey: string, event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const inputValue = event.target.value;
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

  return (
    <div className="relative">
      <Textarea
        placeholder={placeholder}
        value={getCurrentLanguageValue(i18nData)}
        onChange={handleMainInputChange}
        className={`pr-14 ${className || ''}`}
      />
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          <Button icon={<EditIcon />} variant="outline" size="icon" className="absolute right-1 top-1" />
        </DialogTrigger>
        <DialogContent>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <div className="space-y-6">
            {LANGUAGES_LIST.map(([key, label]) => {
              const languageKey = LANGUAGE_MAPPER[key as keyof typeof LANGUAGE_MAPPER] || key;
              return (
                <div key={languageKey} className="flex flex-col gap-4">
                  <label className="text-xs font-medium text-gray-11" htmlFor={`i18n-textarea-${languageKey}`}>
                    {label}
                  </label>
                  <Textarea
                    id={`i18n-textarea-${languageKey}`}
                    placeholder={placeholder}
                    value={i18nData[languageKey] || ''}
                    onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) =>
                      handleLanguageValueChange(languageKey, event)
                    }
                    className="h-28 grow resize-none"
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
