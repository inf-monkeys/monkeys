import React, { useEffect, useState } from 'react';

import { isEmpty } from 'lodash';
import { EditIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { LANGUAGES_LIST } from '@/components/ui/i18n-selector/consts';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface ISimpleDisplayNameDialogProps extends React.ComponentPropsWithoutRef<'div'> {
  title: string;
  description?: string;
  placeholder?: string;
  initialValue?: string | Record<string, string>;
  onFinished?: (value: string | Record<string, string>) => void;
  disabled?: boolean;
}

// 语言映射：前端使用的语言代码 -> i18n 标准代码
const LANGUAGE_MAPPER = {
  en: 'en-US',
  zh: 'zh-CN',
};

export const SimpleDisplayNameDialog: React.FC<ISimpleDisplayNameDialogProps> = ({
  children,
  title,
  description,
  initialValue,
  placeholder,
  onFinished,
  disabled,
}) => {
  const { t, i18n } = useTranslation();

  // 当前语言对应的 i18n 键
  const currentLanguageKey = LANGUAGE_MAPPER[i18n.language as keyof typeof LANGUAGE_MAPPER] || 'en-US';

  // 状态管理
  const [mainDialogOpen, setMainDialogOpen] = useState(false);
  const [i18nDialogOpen, setI18nDialogOpen] = useState(false);
  const [i18nDisplayName, setI18nDisplayName] = useState<Record<string, string>>({});

  // 初始化 i18n 数据
  useEffect(() => {
    if (initialValue) {
      if (typeof initialValue === 'string') {
        // 将旧的字符串格式转换为 i18n 对象
        const i18nData = { [currentLanguageKey]: initialValue };
        setI18nDisplayName(i18nData);
      } else {
        setI18nDisplayName(initialValue);
      }
    } else {
      setI18nDisplayName({});
    }
  }, [initialValue, currentLanguageKey]);

  // 获取当前语言的显示值
  const getCurrentLanguageValue = (i18nData: Record<string, string>) => {
    // 优先显示当前语言的值
    if (i18nData[currentLanguageKey]) {
      return i18nData[currentLanguageKey];
    }
    // 如果当前语言没有值，显示第一个有值的语言
    const firstValue = Object.values(i18nData).find((v) => v && v.trim().length > 0);
    return firstValue || '';
  };

  // 主输入框值变化处理
  const handleMainInputChange = (value: string) => {
    const newI18nData = { ...i18nDisplayName, [currentLanguageKey]: value };
    setI18nDisplayName(newI18nData);
  };

  // Dialog 中特定语言的值变化处理
  const handleLanguageValueChange = (languageKey: string, value: string) => {
    const newI18nData = { ...i18nDisplayName, [languageKey]: value };
    setI18nDisplayName(newI18nData);
  };

  // i18n Dialog 保存处理
  const handleI18nSave = () => {
    // 过滤掉空值
    const filteredData = Object.fromEntries(
      Object.entries(i18nDisplayName).filter(([_, value]) => value && value.trim().length > 0),
    );

    // 更新状态
    setI18nDisplayName(filteredData);
    setI18nDialogOpen(false);
  };

  // 主 Dialog 保存处理
  const handleMainSave = () => {
    const currentValue = getCurrentLanguageValue(i18nDisplayName);

    if (isEmpty(currentValue)) {
      toast.error(t('settings.account.info-editor.invalid-toast'));
      return;
    }

    // 过滤掉空值
    const filteredData = Object.fromEntries(
      Object.entries(i18nDisplayName).filter(([_, value]) => value && value.trim().length > 0),
    );

    // 判断是否与初始值相同
    const hasChanged =
      typeof initialValue === 'string'
        ? currentValue !== initialValue
        : JSON.stringify(filteredData) !== JSON.stringify(initialValue);

    if (hasChanged) {
      // 如果只有一种语言有值，可以考虑返回字符串格式
      // 但为了一致性，我们返回 i18n 对象
      const hasAnyValue = Object.keys(filteredData).length > 0;
      onFinished?.(hasAnyValue ? filteredData : '');
    }

    setMainDialogOpen(false);
  };

  // 打开 i18n 编辑 Dialog
  const handleOpenI18nDialog = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setI18nDialogOpen(true);
  };

  return (
    <>
      {/* 主 Dialog */}
      <Dialog open={mainDialogOpen} onOpenChange={(val) => !disabled && setMainDialogOpen(val)}>
        <DialogTrigger asChild>{children}</DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            {description && <DialogDescription>{description}</DialogDescription>}
          </DialogHeader>

          <div className="gap-4 py-4">
            <div className="relative">
              <Input
                placeholder={placeholder}
                maxLength={16}
                value={getCurrentLanguageValue(i18nDisplayName)}
                onChange={handleMainInputChange}
                className="pr-12"
                autoFocus
              />

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    icon={<EditIcon />}
                    variant="outline"
                    size="icon"
                    className="absolute inset-y-1 right-1 scale-75"
                    onClick={handleOpenI18nDialog}
                  />
                </TooltipTrigger>
                <TooltipContent>Edit i18n Names</TooltipContent>
              </Tooltip>
            </div>
          </div>

          <DialogFooter>
            <Button variant="solid" onClick={handleMainSave}>
              {t('common.utils.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* i18n 编辑 Dialog - 移到外层避免嵌套 */}
      <Dialog open={i18nDialogOpen} onOpenChange={setI18nDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit i18n Names</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {LANGUAGES_LIST.map(([key, label]) => {
              const languageKey = LANGUAGE_MAPPER[key as keyof typeof LANGUAGE_MAPPER] || key;
              return (
                <div key={languageKey} className="flex flex-col gap-2">
                  <label className="text-sm font-medium" htmlFor={`i18n-input-${languageKey}`}>
                    {label}
                  </label>
                  <Input
                    id={`i18n-input-${languageKey}`}
                    placeholder={placeholder}
                    value={i18nDisplayName[languageKey] || ''}
                    onChange={(value: string) => handleLanguageValueChange(languageKey, value)}
                    maxLength={16}
                  />
                </div>
              );
            })}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleI18nSave}>
              {t('common.utils.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
