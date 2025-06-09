import React, { useEffect, useState } from 'react';

import { EditIcon } from 'lucide-react';
import { UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form.tsx';
import { LANGUAGES_LIST } from '@/components/ui/i18n-selector/consts';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipTrigger } from '@/components/ui/tooltip';

interface IFieldDisplayNameProps extends React.ComponentPropsWithoutRef<'div'> {
  form: UseFormReturn<IWorkflowInput>;
}

// 语言映射：前端使用的语言代码 -> i18n 标准代码
const LANGUAGE_MAPPER = {
  en: 'en-US',
  zh: 'zh-CN',
};

export const FieldDisplayName: React.FC<IFieldDisplayNameProps> = ({ form }) => {
  const { t, i18n } = useTranslation();

  // 当前语言对应的 i18n 键
  const currentLanguageKey = LANGUAGE_MAPPER[i18n.language as keyof typeof LANGUAGE_MAPPER] || 'en-US';

  // 内部状态管理 i18n 数据
  const [i18nDisplayName, setI18nDisplayName] = useState<Record<string, string>>({});
  const [dialogOpen, setDialogOpen] = useState(false);

  // 初始化 i18n 数据
  useEffect(() => {
    const currentValue = form.getValues('displayName');
    if (typeof currentValue === 'string') {
      // 将旧的字符串格式转换为 i18n 对象
      const i18nData = { [currentLanguageKey]: currentValue };
      setI18nDisplayName(i18nData);
      // 更新表单数据为 i18n 格式
      form.setValue('displayName', i18nData);
    } else if (currentValue && typeof currentValue === 'object') {
      setI18nDisplayName(currentValue);
    } else {
      setI18nDisplayName({});
    }
  }, [form, currentLanguageKey]);

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

    // 如果所有语言都为空，保存空字符串触发验证
    const hasAnyValue = Object.values(newI18nData).some((v) => v && v.trim().length > 0);
    form.setValue('displayName', hasAnyValue ? newI18nData : '');
  };

  // Dialog 中特定语言的值变化处理
  const handleLanguageValueChange = (languageKey: string, value: string) => {
    const newI18nData = { ...i18nDisplayName, [languageKey]: value };
    setI18nDisplayName(newI18nData);
  };

  // Dialog 保存处理
  const handleSave = () => {
    // 过滤掉空值
    const filteredData = Object.fromEntries(
      Object.entries(i18nDisplayName).filter(([_, value]) => value && value.trim().length > 0),
    );

    // 如果过滤后没有任何值，保存空字符串以触发验证错误
    // 否则保存 i18n 对象
    const hasAnyValue = Object.keys(filteredData).length > 0;
    form.setValue('displayName', hasAnyValue ? filteredData : '');
    setDialogOpen(false);
  };

  return (
    <FormField
      name="displayName"
      control={form.control}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{t('workspace.flow-view.endpoint.start-tool.input.config-form.display-name.label')}</FormLabel>
          <FormControl>
            <div className="relative">
              <Input
                placeholder={t('workspace.flow-view.endpoint.start-tool.input.config-form.display-name.placeholder')}
                value={getCurrentLanguageValue(i18nDisplayName)}
                onChange={(value: string) => handleMainInputChange(value)}
                className="grow pr-14"
                autoFocus
              />
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        icon={<EditIcon />}
                        variant="outline"
                        size="icon"
                        className="absolute inset-y-1 right-1"
                      />
                    </TooltipTrigger>
                  </Tooltip>
                </DialogTrigger>
                <DialogContent>
                  <DialogTitle>Edit i18n Name</DialogTitle>
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
                            placeholder={t(
                              'workspace.flow-view.endpoint.start-tool.input.config-form.display-name.placeholder',
                            )}
                            value={i18nDisplayName[languageKey] || ''}
                            onChange={(value: string) => handleLanguageValueChange(languageKey, value)}
                            className="grow"
                          />
                        </div>
                      );
                    })}
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={handleSave}>
                      {t('workspace.flow-view.endpoint.start-tool.input.config-form.submit')}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};
