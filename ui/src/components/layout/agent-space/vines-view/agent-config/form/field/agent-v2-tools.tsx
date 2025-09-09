import React, { useEffect, useState } from 'react';

import { UseFormReturn } from 'react-hook-form';
import { toast } from 'sonner';

import { updateAgentV2Tools, useAgentV2Tools, useAvailableToolsV2 } from '@/apis/agents-v2';
import { IAgentV2BuiltinTool, IAgentV2ExternalTool } from '@/apis/agents-v2/typings';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.tsx';
import { Checkbox } from '@/components/ui/checkbox';
import { FormDescription, FormItem, FormLabel } from '@/components/ui/form.tsx';
import { VinesLoading } from '@/components/ui/loading';
import { IAgentV2Config } from '@/schema/agent-v2/agent-v2-config.ts';
import { getI18nContent } from '@/utils';

interface IAgentV2ConfigFormFieldToolsProps {
  form: UseFormReturn<IAgentV2Config>;
  agentId?: string;
}

export const AgentV2ConfigFormFieldTools: React.FC<IAgentV2ConfigFormFieldToolsProps> = ({ form, agentId }) => {
  const { data: availableToolsData, isLoading: availableToolsLoading } = useAvailableToolsV2();
  const { data: agentToolsData, isLoading: agentToolsLoading, mutate: mutateAgentTools } = useAgentV2Tools(agentId);

  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [updating, setUpdating] = useState(false);

  // Update selected tools when agent tools data changes
  useEffect(() => {
    // Handle both wrapped and unwrapped response formats
    const toolsData: any = (agentToolsData as any)?.data || agentToolsData;
    if (toolsData?.external?.enabled) {
      setSelectedTools(toolsData.external.enabled);
      form.setValue('enabledTools', toolsData.external.enabled);
    }
  }, [agentToolsData, form]);

  const handleToolToggle = (toolName: string, enabled: boolean) => {
    const newSelected = enabled ? [...selectedTools, toolName] : selectedTools.filter((name) => name !== toolName);

    setSelectedTools(newSelected);
    form.setValue('enabledTools', newSelected);
  };

  const handleSaveTools = async () => {
    if (!agentId) {
      toast.error('智能体ID不能为空');
      return;
    }

    setUpdating(true);
    try {
      const result = await updateAgentV2Tools(agentId, {
        enabled: selectedTools.length > 0,
        toolNames: selectedTools,
      });

      console.log('Tools update result:', result);

      // Handle both wrapped and unwrapped response formats
      const success = result?.success || (result && typeof result === 'object' && !result.error);

      if (success) {
        toast.success('工具配置已更新');
        await mutateAgentTools();
      } else {
        toast.error(`更新失败: ${result?.error || '未知错误'}`);
      }
    } catch (error) {
      console.error('Failed to update tools:', error);
      toast.error('更新工具配置失败');
    } finally {
      setUpdating(false);
    }
  };

  const renderTool = (tool: IAgentV2ExternalTool, isEnabled: boolean) => {
    const displayName =
      typeof tool.displayName === 'string'
        ? tool.displayName
        : getI18nContent(tool.displayName) || Object.values(tool.displayName)[0] || 'Unknown';
    const description =
      typeof tool.description === 'string'
        ? tool.description
        : getI18nContent(tool.description) || Object.values(tool.description)[0] || '';

    return (
      <div key={tool.name} className="flex items-start space-x-3 rounded-lg border p-4">
        <Checkbox checked={isEnabled} onCheckedChange={(checked) => handleToolToggle(tool.name, checked as boolean)} />
        <div className="flex-1 space-y-2">
          <div className="flex items-center space-x-2">
            <h4 className="text-sm font-medium">{displayName}</h4>
            <Badge variant="secondary" className="text-xs">
              {tool.namespace}
            </Badge>
            {tool.categories?.map((category) => (
              <Badge key={category} variant="outline" className="text-xs">
                {category}
              </Badge>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
    );
  };

  const renderBuiltinTool = (tool: IAgentV2BuiltinTool) => (
    <div key={tool.name} className="flex items-start space-x-3 rounded-lg border bg-muted/50 p-4">
      <Checkbox checked disabled />
      <div className="flex-1 space-y-2">
        <div className="flex items-center space-x-2">
          <h4 className="text-sm font-medium">{tool.displayName}</h4>
          <Badge variant="default" className="text-xs">
            内置工具
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">{tool.description}</p>
      </div>
    </div>
  );

  if (availableToolsLoading || agentToolsLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>工具配置</CardTitle>
          <CardDescription>配置智能体可以使用的工具</CardDescription>
        </CardHeader>
        <CardContent>
          <VinesLoading />
        </CardContent>
      </Card>
    );
  }

  // Get available tools from availableToolsData, but use agentToolsData for current state
  const availableExternalTools = availableToolsData?.data?.external?.available || [];
  const builtinTools = availableToolsData?.data?.builtin || [];

  // If availableToolsData is not loaded yet, fallback to agentToolsData
  const fallbackExternalTools = (agentToolsData as any)?.external?.available || [];
  const actualExternalTools = availableExternalTools.length > 0 ? availableExternalTools : fallbackExternalTools;

  return (
    <FormItem card>
      <FormLabel>工具配置</FormLabel>
      <FormDescription className="w-[30rem]">
        选择智能体可以使用的工具。内置工具默认启用，外部工具可以根据需要选择启用。
      </FormDescription>

      <Card>
        <CardContent className="pt-6">
          <div className="space-y-6">
            {/* External Tools Only */}
            {actualExternalTools.length > 0 ? (
              <>
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-medium">外部工具</h3>
                    <div className="text-xs text-muted-foreground">
                      已选择: {selectedTools.length}/{actualExternalTools.length}
                    </div>
                  </div>
                  <div className="space-y-3">
                    {actualExternalTools.map((tool) => renderTool(tool, selectedTools.includes(tool.name)))}
                  </div>
                </div>

                <div className="flex justify-end border-t pt-4">
                  <Button onClick={handleSaveTools} loading={updating} size="small">
                    保存工具配置
                  </Button>
                </div>
              </>
            ) : (
              <div className="py-8 text-center text-muted-foreground">暂无可用的外部工具</div>
            )}
          </div>
        </CardContent>
      </Card>
    </FormItem>
  );
};
