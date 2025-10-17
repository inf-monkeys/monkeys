import React from 'react';

import { UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form.tsx';
import { Textarea } from '@/components/ui/textarea.tsx';
import { IWorkflowInput } from '@/schema/workspace/workflow-input.ts';

interface IFieldPromptDictionaryProps extends React.ComponentPropsWithoutRef<'div'> {
  form: UseFormReturn<IWorkflowInput>;
}

/**
 * 提示词字典编辑：
 * - 直接编辑 JSON，对齐 TextWithButtons 的三种数据形态；
 * - 提供校验与格式化按钮；
 */
export const FieldPromptDictionary: React.FC<IFieldPromptDictionaryProps> = ({ form }) => {
  const { t } = useTranslation();

  const [jsonText, setJsonText] = React.useState<string>('');
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const v = (form.getValues() as any)?.promptDictionary;
    try {
      setJsonText(v ? JSON.stringify(v, null, 2) : '');
      setError(null);
    } catch {
      setJsonText('');
    }
  }, [form]);

  const handleFormat = () => {
    try {
      const parsed = jsonText?.trim() ? JSON.parse(jsonText) : undefined;
      setJsonText(parsed ? JSON.stringify(parsed, null, 2) : '');
      setError(null);
      form.setValue('promptDictionary' as any, parsed as any);
    } catch (e: any) {
      setError(e?.message || 'JSON 解析失败');
    }
  };

  return (
    <FormField
      name={'promptDictionary' as any}
      control={form.control}
      render={() => (
        <FormItem>
          <FormLabel>提示词字典（支持三级分类，填 JSON）</FormLabel>
          <FormControl>
            <div className="space-y-2">
              <Textarea
                className="h-40 resize-none font-mono text-[12px]"
                placeholder={`示例：\n{\n  "题材": {\n    "人物画": ["单人肖像", "半身像"]\n  }\n}\n或：\n{\n  "entries": [{"level1":"题材","level2":"人物画","label":"单人肖像"}]\n}`}
                value={jsonText}
                onChange={(e) => setJsonText(e.target.value)}
              />
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={handleFormat}>
                  校验并格式化
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    try {
                      const parsed = jsonText?.trim() ? JSON.parse(jsonText) : undefined;
                      form.setValue('promptDictionary' as any, parsed as any);
                      setError(null);
                    } catch (e: any) {
                      setError(e?.message || 'JSON 解析失败');
                    }
                  }}
                >
                  应用到输入
                </Button>
              </div>
              {error && <div className="text-xs text-red-10">{error}</div>}
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};
