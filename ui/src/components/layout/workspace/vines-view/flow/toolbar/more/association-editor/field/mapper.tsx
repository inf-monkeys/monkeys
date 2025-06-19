import React, { useEffect, useState } from 'react';

import { Plus, Trash2 } from 'lucide-react';
import { UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form.tsx';
import { Input } from '@/components/ui/input';
import { IWorkflowAssociationForEditor } from '@/schema/workspace/workflow-association';

interface IFieldMapperProps extends React.ComponentPropsWithoutRef<'div'> {
  form: UseFormReturn<IWorkflowAssociationForEditor>;
}

type ToWorkflowMapperItem = {
  origin: string;
  target: string;
  default?: string;
};

type MapperItem = ToWorkflowMapperItem;

export const FieldMapper: React.FC<IFieldMapperProps> = ({ form }) => {
  const { t } = useTranslation();

  // 内部状态管理 mapper 数据
  const [mapperItems, setMapperItems] = useState<MapperItem[]>([]);

  // 初始化 mapper 数据
  useEffect(() => {
    const currentValue = form.getValues('mapper');
    if (Array.isArray(currentValue)) {
      setMapperItems(currentValue as MapperItem[]);
    } else {
      setMapperItems([]);
    }
  }, [form]);

  // 添加新的映射项
  const handleAddMapper = () => {
    const newItem: MapperItem = {
      origin: '',
      target: '',
      default: '',
    };
    const newMapperItems = [...mapperItems, newItem];
    setMapperItems(newMapperItems);
    form.setValue('mapper', newMapperItems);
  };

  // 删除映射项
  const handleRemoveMapper = (index: number) => {
    const newMapperItems = mapperItems.filter((_, i) => i !== index);
    setMapperItems(newMapperItems);
    form.setValue('mapper', newMapperItems);
  };

  // 更新映射项的值
  const handleMapperChange = (index: number, field: keyof MapperItem, value: string) => {
    const newMapperItems = mapperItems.map((item, i) => {
      if (i === index) {
        return { ...item, [field]: value };
      }
      return item;
    });
    setMapperItems(newMapperItems);
    form.setValue('mapper', newMapperItems);
  };

  return (
    <FormField
      name="mapper"
      control={form.control}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{t('workspace.flow-view.tooltip.more.association-editor.editor.field.mapper.label')}</FormLabel>
          <FormDescription>
            {t('workspace.flow-view.tooltip.more.association-editor.editor.field.mapper.description')}
          </FormDescription>
          <FormControl>
            <div className="space-y-3">
              {mapperItems.map((item, index) => (
                <div key={index} className="flex items-center gap-2 rounded-lg border border-border p-3">
                  <div className="flex flex-1 flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <Input
                        placeholder={t(
                          'workspace.flow-view.tooltip.more.association-editor.editor.field.mapper.origin-placeholder',
                        )}
                        value={item.origin}
                        onChange={(value: string) => handleMapperChange(index, 'origin', value)}
                        className="flex-1"
                      />
                      <div className="text-muted-foreground">→</div>
                      <Input
                        placeholder={t(
                          'workspace.flow-view.tooltip.more.association-editor.editor.field.mapper.target-placeholder',
                        )}
                        value={item.target}
                        onChange={(value: string) => handleMapperChange(index, 'target', value)}
                        className="flex-1"
                      />
                    </div>
                    <Input
                      placeholder={t(
                        'workspace.flow-view.tooltip.more.association-editor.editor.field.mapper.default-placeholder',
                      )}
                      value={item.default || ''}
                      onChange={(value: string) => handleMapperChange(index, 'default', value)}
                      className="flex-1"
                    />
                  </div>
                  <Button
                    icon={<Trash2 />}
                    variant="outline"
                    size="icon"
                    onClick={() => handleRemoveMapper(index)}
                    className="shrink-0"
                  />
                </div>
              ))}
              <Button
                icon={<Plus />}
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  handleAddMapper();
                }}
                className="w-full"
              >
                {t('workspace.flow-view.tooltip.more.association-editor.editor.field.mapper.add')}
              </Button>
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};
