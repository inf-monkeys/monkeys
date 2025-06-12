import React, { useEffect, useState } from 'react';

import { EditIcon } from 'lucide-react';
import { UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form.tsx';
import { LANGUAGES_LIST } from '@/components/ui/i18n-selector/consts';
import { Textarea } from '@/components/ui/textarea';
import { IWorkflowAssociationForEditor } from '@/schema/workspace/workflow-association';

interface IFieldDescriptionProps extends React.ComponentPropsWithoutRef<'div'> {
  form: UseFormReturn<IWorkflowAssociationForEditor>;
}

// 语言映射：前端使用的语言代码 -> i18n 标准代码
export const LANGUAGE_MAPPER = {
  en: 'en-US',
  zh: 'zh-CN',
};

export const FieldDescription: React.FC<IFieldDescriptionProps> = ({ form }) => {
  const { t, i18n } = useTranslation();

  // 当前语言对应的 i18n 键
  const currentLanguageKey = LANGUAGE_MAPPER[i18n.language as keyof typeof LANGUAGE_MAPPER] || 'en-US';

  // 内部状态管理 i18n 数据
  const [i18nDescription, setI18nDescription] = useState<Record<string, string>>({});
  const [dialogOpen, setDialogOpen] = useState(false);

  // 初始化 i18n 数据
  useEffect(() => {
    const currentValue = form.getValues('description');
    if (typeof currentValue === 'string') {
      // 将旧的字符串格式转换为 i18n 对象
      const i18nData = { [currentLanguageKey]: currentValue };
      setI18nDescription(i18nData);
      // 更新表单数据为 i18n 格式
      form.setValue('description', i18nData);
    } else if (currentValue && typeof currentValue === 'object') {
      setI18nDescription(currentValue);
    } else {
      setI18nDescription({});
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
    const newI18nData = { ...i18nDescription, [currentLanguageKey]: value };
    setI18nDescription(newI18nData);

    // 如果所有语言都为空，保存空字符串触发验证
    const hasAnyValue = Object.values(newI18nData).some((v) => v && v.trim().length > 0);
    form.setValue('description', hasAnyValue ? newI18nData : '');
  };

  // Dialog 中特定语言的值变化处理
  const handleLanguageValueChange = (languageKey: string, value: string) => {
    const newI18nData = { ...i18nDescription, [languageKey]: value };
    setI18nDescription(newI18nData);
  };

  // Dialog 保存处理
  const handleSave = () => {
    // 过滤掉空值
    const filteredData = Object.fromEntries(
      Object.entries(i18nDescription).filter(([_, value]) => value && value.trim().length > 0),
    );

    // 如果过滤后没有任何值，保存空字符串以触发验证错误
    // 否则保存 i18n 对象
    const hasAnyValue = Object.keys(filteredData).length > 0;
    form.setValue('description', hasAnyValue ? filteredData : '');
    setDialogOpen(false);
  };

  return (
    <FormField
      name="description"
      control={form.control}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{t('workspace.flow-view.endpoint.start-tool.input.config-form.description.label')}</FormLabel>
          <FormControl>
            <div className="relative">
              <Textarea
                placeholder={t('workspace.flow-view.endpoint.start-tool.input.config-form.description.placeholder')}
                value={getCurrentLanguageValue(i18nDescription)}
                onChange={(e) => handleMainInputChange(e.target.value)}
                className="min-h-[100px] grow pr-14"
                autoFocus
              />
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button icon={<EditIcon />} variant="outline" size="icon" className="absolute right-1 top-1" />
                </DialogTrigger>
                <DialogContent>
                  <DialogTitle>Edit i18n Description</DialogTitle>
                  <div className="space-y-6">
                    {LANGUAGES_LIST.map(([key, label]) => {
                      const languageKey = LANGUAGE_MAPPER[key as keyof typeof LANGUAGE_MAPPER] || key;
                      return (
                        <div key={languageKey} className="flex flex-col gap-4">
                          <label className="text-xs font-medium text-gray-11" htmlFor={`i18n-input-${languageKey}`}>
                            {label}
                          </label>
                          <Textarea
                            id={`i18n-input-${languageKey}`}
                            placeholder={t(
                              'workspace.flow-view.endpoint.start-tool.input.config-form.description.placeholder',
                            )}
                            value={i18nDescription[languageKey] || ''}
                            onChange={(e) => handleLanguageValueChange(languageKey, e.target.value)}
                            className="min-h-[100px] grow"
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
