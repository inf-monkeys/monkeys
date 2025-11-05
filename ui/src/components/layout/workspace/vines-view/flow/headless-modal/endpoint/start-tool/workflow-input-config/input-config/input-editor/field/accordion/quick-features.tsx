import React from 'react';

import { UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button/index.tsx';
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form.tsx';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { IWorkflowInput } from '@/schema/workspace/workflow-input.ts';

interface IFieldQuickFeaturesProps extends React.ComponentPropsWithoutRef<'div'> {
  form: UseFormReturn<IWorkflowInput>;
}

export const FieldQuickFeatures: React.FC<IFieldQuickFeaturesProps> = ({ form }) => {
  const { t } = useTranslation();
  const enableVoice = form.watch('enableVoice');
  const enableExpand = form.watch('enableExpand');
  const promptDictionary = form.watch('promptDictionary');
  const enableSelectList = form.watch('enableSelectList');
  const selectList = form.watch('selectList');

  return (
    <>
      {enableSelectList && selectList && selectList.length > 0 && (
        <FormField
          name="selectListDisplayMode"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>列表显示模式</FormLabel>
              <FormControl>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={field.value === 'dropdown' || !field.value ? 'default' : 'outline'}
                    size="small"
                    onClick={() => field.onChange('dropdown')}
                    className="flex-1"
                  >
                    下拉选择
                  </Button>
                  <Button
                    type="button"
                    variant={field.value === 'button' ? 'default' : 'outline'}
                    size="small"
                    onClick={() => field.onChange('button')}
                    className="flex-1"
                  >
                    方框按钮
                  </Button>
                </div>
              </FormControl>
              <FormDescription>选择列表选项的展示方式</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
      <FormField
        name="enableVoice"
        control={form.control}
        render={({ field }) => (
          <FormItem>
            <div className="-mb-2 flex items-center justify-between py-2">
              <FormLabel>
                {t('workspace.flow-view.endpoint.start-tool.input.config-form.type-options.voice.label')}
              </FormLabel>
              <FormControl>
                <Switch size="small" checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
            </div>
            <FormDescription>
              {t('workspace.flow-view.endpoint.start-tool.input.config-form.type-options.voice.desc')}
            </FormDescription>
            {enableVoice && (
              <FormField
                name="voiceButtonText"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">自定义按钮文本（留空仅显示图标）</FormLabel>
                    <FormControl>
                      <Input placeholder="留空仅显示图标" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            )}
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        name="enableExpand"
        control={form.control}
        render={({ field }) => (
          <FormItem>
            <div className="-mb-2 flex items-center justify-between py-2">
              <FormLabel>
                {t('workspace.flow-view.endpoint.start-tool.input.config-form.type-options.expand.label')}
              </FormLabel>
              <FormControl>
                <Switch size="small" checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
            </div>
            <FormDescription>
              {t('workspace.flow-view.endpoint.start-tool.input.config-form.type-options.expand.desc')}
            </FormDescription>
            {enableExpand && (
              <FormField
                name="expandButtonText"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">自定义按钮文本（留空仅显示图标）</FormLabel>
                    <FormControl>
                      <Input placeholder="留空仅显示图标" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            )}
            <FormMessage />
          </FormItem>
        )}
      />
      {promptDictionary && (
        <FormField
          name="knowledgeGraphButtonText"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>知识图谱按钮文本（留空仅显示图标）</FormLabel>
              <FormControl>
                <Input placeholder="留空仅显示图标" {...field} />
              </FormControl>
              <FormDescription>自定义知识图谱按钮显示的文字，留空则不显示文字</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
    </>
  );
};
