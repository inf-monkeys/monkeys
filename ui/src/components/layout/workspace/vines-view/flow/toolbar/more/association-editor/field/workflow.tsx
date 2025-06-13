import React, { useEffect, useState } from 'react';

import { MonkeyWorkflow } from '@inf-monkeys/monkeys';
import { Check, ChevronsUpDown } from 'lucide-react';
import { UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { useWorkflowList } from '@/apis/workflow';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form.tsx';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area.tsx';
import { VinesIcon } from '@/components/ui/vines-icon';
import { DEFAULT_WORKFLOW_ICON_URL } from '@/consts/icons';
import { IWorkflowAssociationForEditor } from '@/schema/workspace/workflow-association';
import { useFlowStore } from '@/store/useFlowStore';
import { cn, getI18nContent } from '@/utils';

interface IFieldWorkflowProps extends React.ComponentPropsWithoutRef<'div'> {
  form: UseFormReturn<IWorkflowAssociationForEditor>;
}

const getWorkflowDisplayName = (workflow?: MonkeyWorkflow) => {
  if (!workflow) return '';
  const displayName = getI18nContent(workflow.displayName);
  return (
    <span className="flex items-center gap-2">
      <VinesIcon src={workflow.iconUrl ?? DEFAULT_WORKFLOW_ICON_URL} size="xs" />
      <span>{displayName}</span>
    </span>
  );
};

export const FieldWorkflow: React.FC<IFieldWorkflowProps> = ({ form }) => {
  const { t } = useTranslation();
  const { workflowId: currentWorkflowId } = useFlowStore();

  const { data: workflowList, isLoading } = useWorkflowList();
  const [visible, setVisible] = useState(false);
  const [filteredWorkflows, setFilteredWorkflows] = useState<MonkeyWorkflow[]>([]);

  // 过滤工作流列表，排除当前工作流
  useEffect(() => {
    if (!workflowList) {
      setFilteredWorkflows([]);
      return;
    }

    const filtered = workflowList.filter((workflow) => workflow.workflowId !== currentWorkflowId);
    setFilteredWorkflows(filtered);
  }, [workflowList, currentWorkflowId]);

  const selectedWorkflowId = form.watch('targetWorkflowId');
  const selectedWorkflow = filteredWorkflows.find((w) => w.workflowId === selectedWorkflowId);

  return (
    <FormField
      name="targetWorkflowId"
      control={form.control}
      render={({ field: { value, ...field } }) => (
        <FormItem>
          <FormLabel>
            {t('workspace.flow-view.tooltip.more.association-editor.editor.field.target-workflow-id.label')}
          </FormLabel>
          <FormControl>
            <Popover open={visible} onOpenChange={setVisible}>
              <PopoverTrigger asChild>
                <FormControl>
                  <Button
                    variant="outline"
                    role="combobox"
                    className={cn('w-full justify-between', !value && 'text-muted-foreground')}
                  >
                    {value
                      ? getWorkflowDisplayName(selectedWorkflow!)
                      : isLoading
                        ? t('common.load.loading')
                        : t(
                          'workspace.flow-view.tooltip.more.association-editor.editor.field.target-workflow-id.placeholder',
                        )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent className="p-0">
                <Command>
                  <CommandInput
                    placeholder={t(
                      'workspace.flow-view.tooltip.more.association-editor.editor.field.target-workflow-id.search-placeholder',
                    )}
                  />
                  <CommandEmpty>
                    {t(
                      'workspace.flow-view.tooltip.more.association-editor.editor.field.target-workflow-id.search-empty',
                    )}
                  </CommandEmpty>
                  <ScrollArea className="h-64">
                    <CommandGroup>
                      {filteredWorkflows.map((workflow) => (
                        <CommandItem
                          value={workflow.workflowId}
                          key={workflow.workflowId}
                          onSelect={() => {
                            field.onChange(workflow.workflowId);
                            setVisible(false);
                          }}
                        >
                          <Check
                            className={cn('mr-2 h-4 w-4', workflow.workflowId === value ? 'opacity-100' : 'opacity-0')}
                          />
                          <div className="flex items-center gap-2">
                            <VinesIcon src={workflow.iconUrl || DEFAULT_WORKFLOW_ICON_URL} size="xs" />
                            <div className="flex flex-col">
                              <span className="font-medium">{getI18nContent(workflow.displayName)}</span>
                              {workflow.description && (
                                <span className="text-xs text-muted-foreground">
                                  {getI18nContent(workflow.description)}
                                </span>
                              )}
                            </div>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </ScrollArea>
                </Command>
              </PopoverContent>
            </Popover>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};
