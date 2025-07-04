import React, { useState } from 'react';

import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { LANGUAGES_LIST } from '@/components/ui/i18n-selector/consts';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ISimpleDisplayNameDialogProps extends React.ComponentPropsWithoutRef<'div'> {
  title: string;
  placeholder?: string;
  initialValue?: string | Record<string, string>;
  onFinished: (value: string | Record<string, string>) => void;
  i18nJSON?: string;
}

// 语言映射：前端使用的语言代码 -> i18n 标准代码
const LANGUAGE_MAPPER = {
  en: 'en-US',
  zh: 'zh-CN',
};

// 安全地处理初始值，确保正确解析
/* const processInitialValue = (
  value: string | Record<string, string> | null | undefined,
  currentLanguageKey: string,
): Record<string, string> => {
  // 如果是空值
  if (!value) return {};

  // 如果已经是对象
  if (typeof value === 'object' && value !== null) {
    // 确保对象的值都是字符串类型
    const result: Record<string, string> = {};
    for (const [key, val] of Object.entries(value)) {
      if (typeof val === 'string') {
        result[key] = val;
      } else if (val !== null && val !== undefined) {
        // 如果值不是字符串，转换为字符串
        result[key] = String(val);
      }
    }
    return result;
  }

  // 如果是字符串
  if (typeof value === 'string') {
    const trimmedValue = value.trim();
    if (trimmedValue === '') return {};

    // 尝试解析为JSON对象
    try {
      const parsed = JSON.parse(trimmedValue);
      if (typeof parsed === 'object' && parsed !== null) {
        // 递归处理解析出的对象
        return processInitialValue(parsed, currentLanguageKey);
      } else {
        // 解析出来不是对象，当作普通字符串处理
        return { [currentLanguageKey]: trimmedValue };
      }
    } catch {
      // JSON解析失败，当作普通字符串处理
      return { [currentLanguageKey]: trimmedValue };
    }
  }

  // 其他类型都返回空对象
  return {};
}; */

export const SimpleDisplayNameDialog: React.FC<ISimpleDisplayNameDialogProps> = ({
  children,
  title,
  placeholder,
  initialValue = '',
  onFinished,
  i18nJSON,
}) => {
  const { t } = useTranslation();

  // 当前语言对应的 i18n 键
  // const currentLanguageKey = LANGUAGE_MAPPER[i18n.language as keyof typeof LANGUAGE_MAPPER] || 'en-US';

  // State for dialog open/close
  const [open, setOpen] = useState(false);

  // i18n data state
  const i18nJSONData = (() => {
    if (typeof i18nJSON === 'string') {
      try {
        return JSON.parse(i18nJSON);
      } catch (error) {
        // If JSON parsing fails, return an empty object
        console.warn('Failed to parse i18nJSON:', i18nJSON, error);
        return {};
      }
    }
    return {};
  })();
  // console.log('i18nJSONData', i18nJSONData);

  const [i18nDisplayName, setI18nDisplayName] = useState<Record<string, string>>(i18nJSONData);

  // Initialize data when dialog opens or initialValue changes
  // useEffect(() => {
  //   const processedData = processInitialValue(initialValue, currentLanguageKey);
  //   setI18nDisplayName(processedData);
  //   console.log('i18nDisplayName in useEffect', i18nDisplayName);
  // }, [initialValue, currentLanguageKey]);

  // Dialog 中特定语言的值变化处理
  const handleLanguageValueChange = (languageKey: string, value: string) => {
    setI18nDisplayName((prev) => ({ ...prev, [languageKey]: value }));
  };

  const handleSubmit = () => {
    // 过滤掉空值
    const filteredData = Object.fromEntries(
      Object.entries(i18nDisplayName).filter(([_, value]) => value && value.trim().length > 0),
    );

    if (Object.keys(filteredData).length === 0) {
      toast.error(t('common.input.required'));
      return;
    }

    // 根据初始值类型和过滤后的数据决定返回格式
    const keys = Object.keys(filteredData);

    // 如果初始值是字符串且只有一种语言有值，返回字符串（向后兼容）
    if (typeof initialValue === 'string' && keys.length === 1) {
      onFinished(filteredData[keys[0]]);
    } else {
      // 否则返回 i18n 对象
      const withFallback = {
        'en-US': filteredData['en-US'] || 'Unamed Group',
        'zh-CN': filteredData['zh-CN'] || '未命名组',
      };
      onFinished(withFallback);
    }

    setOpen(false);
  };

  const handleCancel = () => {
    setOpen(false);
    // Reset to initial state
    // const processedData = processInitialValue(initialValue, currentLanguageKey);
    setI18nDisplayName(i18nDisplayName);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {LANGUAGES_LIST.map(([key, label]) => {
            const languageKey = LANGUAGE_MAPPER[key as keyof typeof LANGUAGE_MAPPER] || key;

            // return (
            //   <div key={languageKey} className="flex flex-col gap-2">
            //     <Label htmlFor={`i18n-input-${languageKey}`} className="text-sm font-medium">
            //       {label}
            //     </Label>
            //     <Input
            //       id={`i18n-input-${languageKey}`}
            //       placeholder={placeholder}
            //       value={i18nDisplayName[languageKey] || ''}
            //       // value={i18nJSON ? JSON.parse(i18nJSON)[languageKey] || '' : i18nDisplayName[languageKey] || ''}
            //       onChange={(value) => handleLanguageValueChange(languageKey, value)}
            //     />
            //   </div>
            // );

            return (
              <InputWrapper
                key={key}
                // initialValue={i18nDisplayName[key] || ''}
                handleLanguageValueChange={handleLanguageValueChange}
                languageKey={languageKey}
                label={label}
                placeholder={placeholder || ''}
                // initialValue={i18nJSON ? JSON.parse(i18nJSON)[languageKey] || '' : i18nDisplayName[languageKey] || ''}
                initialValue={i18nDisplayName[languageKey] || ''}
                // onChange={(value) => handleLanguageValueChange(key, value)}
              />
            );
          })}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            {t('workspace.wrapper.space.menu.group.cancel')}
          </Button>
          <Button variant={'outline'} onClick={handleSubmit}>
            {t('workspace.wrapper.space.menu.group.confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

interface IInputWrapperProps {
  initialValue: string;
  // onChange: (value: string) => void;
  languageKey: string;
  label: string;
  placeholder: string;
  handleLanguageValueChange: (languageKey: string, value: string) => void;
}

function InputWrapper({
  initialValue,
  languageKey,
  label,
  placeholder,
  handleLanguageValueChange,
}: IInputWrapperProps) {
  const [value, setValue] = useState(initialValue);
  return (
    <div key={languageKey} className="flex flex-col gap-2">
      <Label htmlFor={`i18n-input-${languageKey}`} className="text-sm font-medium">
        {label}
      </Label>
      <Input
        id={`i18n-input-${languageKey}`}
        placeholder={placeholder}
        value={value}
        // value={i18nJSON ? JSON.parse(i18nJSON)[languageKey] || '' : i18nDisplayName[languageKey] || ''}
        onChange={(value) => {
          setValue(value);
          handleLanguageValueChange(languageKey, value);
        }}
      />
    </div>
  );
}
