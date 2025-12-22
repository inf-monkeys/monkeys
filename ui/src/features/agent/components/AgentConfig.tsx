/**
 * AgentConfig 组件 - Agent 配置界面
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useModelList } from '../hooks/useAgent';
import { useToolList } from '../hooks/useTool';
import type { AgentConfig as AgentConfigType } from '../types/agent.types';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface AgentConfigProps {
  teamId: string;
  agentId?: string;
  initialConfig?: AgentConfigType;
  onSave: (config: AgentConfigType) => void;
  onCancel?: () => void;
}

/**
 * Agent 配置组件 - 使用 shadcn 样式
 */
export function AgentConfig({
  teamId,
  agentId,
  initialConfig,
  onSave,
  onCancel,
}: AgentConfigProps) {
  const { t } = useTranslation();
  const { data: models = [] } = useModelList(teamId);
  const { data: toolsData } = useToolList(teamId);

  // 确保 tools 是数组
  const tools = Array.isArray(toolsData) ? toolsData : [];

  // 辅助函数：安全地提取字符串值（处理翻译对象）
  const safeString = (value: any): string => {
    if (typeof value === 'string') {
      return value;
    }
    if (value && typeof value === 'object') {
      // 尝试从翻译对象中提取值
      return value['zh-CN'] || value['en-US'] || Object.values(value)[0] || '';
    }
    return '';
  };

  const [config, setConfig] = useState<AgentConfigType>(
    initialConfig || {
      model: '',
      instructions: '',
      temperature: 0.7,
      maxTokens: 4096,
      tools: {
        enabled: false,
        toolNames: [],
      },
    },
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(config);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 模型选择 */}
      <div className="space-y-2">
        <Label htmlFor="model">{t('ugc-page.agents.create-dialog.model')}</Label>
        <Select
          value={config.model}
          onValueChange={(value) => setConfig({ ...config, model: value })}
        >
          <SelectTrigger id="model" className="w-full">
            <SelectValue placeholder={t('ugc-page.agents.create-dialog.model-placeholder')} />
          </SelectTrigger>
          <SelectContent>
            {models.map((model) => {
              const displayName = safeString(model.displayName) || safeString(model.modelName);

              return (
                <SelectItem key={model.id} value={model.id}>
                  <div className="flex flex-col items-start">
                    <span className="font-medium">{displayName}</span>
                    <span className="text-xs text-muted-foreground">{model.id}</span>
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      <Separator />

      {/* 系统指令 */}
      <div className="space-y-2">
        <Label htmlFor="instructions">{t('ugc-page.agents.create-dialog.instructions')}</Label>
        <Textarea
          id="instructions"
          value={config.instructions}
          onChange={(e) => setConfig({ ...config, instructions: e.target.value })}
          rows={8}
          placeholder={t('ugc-page.agents.create-dialog.instructions-placeholder')}
          required
          className="resize-none font-mono text-sm"
        />
        <p className="text-xs text-muted-foreground">
          {t('ugc-page.agents.create-dialog.instructions-description')}
        </p>
      </div>

      <Separator />

      {/* Temperature */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>{t('ugc-page.agents.create-dialog.temperature')}</Label>
          <span className="rounded-md bg-muted px-2 py-1 text-sm font-mono">
            {config.temperature?.toFixed(1)}
          </span>
        </div>
        <Slider
          value={[config.temperature ?? 0.7]}
          onValueChange={([value]) => setConfig({ ...config, temperature: value })}
          min={0}
          max={2}
          step={0.1}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{t('ugc-page.agents.create-dialog.temperature-precise')} (0.0)</span>
          <span>{t('ugc-page.agents.create-dialog.temperature-balanced')} (1.0)</span>
          <span>{t('ugc-page.agents.create-dialog.temperature-creative')} (2.0)</span>
        </div>
      </div>

      {/* Max Tokens */}
      <div className="space-y-2">
        <Label htmlFor="maxTokens">{t('ugc-page.agents.create-dialog.max-tokens')}</Label>
        <input
          id="maxTokens"
          type="number"
          value={config.maxTokens}
          onChange={(e) =>
            setConfig({ ...config, maxTokens: parseInt(e.target.value) || 4096 })
          }
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          min="1"
          max="128000"
          required
        />
      </div>

      {/* Top P */}
      <div className="space-y-2">
        <Label htmlFor="topP">{t('ugc-page.agents.create-dialog.top-p')}</Label>
        <input
          id="topP"
          type="number"
          value={config.topP ?? ''}
          onChange={(e) =>
            setConfig({
              ...config,
              topP: e.target.value ? parseFloat(e.target.value) : undefined,
            })
          }
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          min="0"
          max="1"
          step="0.1"
          placeholder={t('ugc-page.agents.create-dialog.top-p-placeholder')}
        />
      </div>

      <Separator />

      {/* Tools */}
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="tools"
            checked={config.tools?.enabled || false}
            onCheckedChange={(checked) =>
              setConfig({
                ...config,
                tools: {
                  ...config.tools,
                  enabled: checked === true,
                  toolNames: config.tools?.toolNames || [],
                },
              })
            }
          />
          <Label htmlFor="tools" className="cursor-pointer font-normal">
            {t('ugc-page.agents.create-dialog.enable-tools')}
          </Label>
        </div>

        {/* Tool Selector */}
        {config.tools?.enabled && (
          <div className="ml-6 space-y-3">
            <Label>Select Tools ({config.tools?.toolNames?.length || 0} selected)</Label>
            <ScrollArea className="h-64 rounded-md border p-4">
              {tools.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No tools available. Please create tools first.
                </p>
              ) : (
                <div className="space-y-2">
                  {tools.map((tool) => {
                    const isSelected = config.tools?.toolNames?.includes(tool.name) || false;

                    // 安全提取工具的字符串属性
                    const toolName = safeString(tool.name);
                    const toolCategory = safeString(tool.category);
                    const toolDescription = safeString(tool.description);

                    return (
                      <div
                        key={tool.id}
                        className="flex items-start space-x-3 rounded-md border p-3 hover:bg-accent cursor-pointer transition-colors"
                        onClick={(e) => {
                          // 避免与 Checkbox 的事件冲突
                          if (e.target instanceof HTMLButtonElement || e.target instanceof HTMLInputElement) {
                            return;
                          }
                          const currentTools = config.tools?.toolNames || [];
                          const newTools = isSelected
                            ? currentTools.filter((t) => t !== tool.name)
                            : [...currentTools, tool.name];
                          setConfig({
                            ...config,
                            tools: {
                              ...config.tools!,
                              toolNames: newTools,
                            },
                          });
                        }}
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(checked) => {
                            const currentTools = config.tools?.toolNames || [];
                            const newTools = checked
                              ? [...currentTools, tool.name]
                              : currentTools.filter((t) => t !== tool.name);
                            setConfig({
                              ...config,
                              tools: {
                                ...config.tools!,
                                toolNames: newTools,
                              },
                            });
                          }}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{toolName}</span>
                            {tool.needsApproval && (
                              <Badge variant="outline" className="text-xs">
                                Requires Approval
                              </Badge>
                            )}
                            {toolCategory && (
                              <Badge variant="secondary" className="text-xs">
                                {toolCategory}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {toolDescription}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </div>
        )}
      </div>

      <Separator />

      {/* Reasoning Effort (for o1/o3 models) */}
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="reasoningEffort"
            checked={config.reasoningEffort?.enabled || false}
            onCheckedChange={(checked) =>
              setConfig({
                ...config,
                reasoningEffort: {
                  enabled: checked === true,
                  level: config.reasoningEffort?.level || 'medium',
                },
              })
            }
          />
          <Label htmlFor="reasoningEffort" className="cursor-pointer font-normal">
            {t('ugc-page.agents.create-dialog.enable-reasoning-effort')}
          </Label>
        </div>

        {config.reasoningEffort?.enabled && (
          <div className="ml-6 space-y-2">
            <Label>{t('ugc-page.agents.create-dialog.reasoning-level')}</Label>
            <Select
              value={config.reasoningEffort.level}
              onValueChange={(value) =>
                setConfig({
                  ...config,
                  reasoningEffort: {
                    ...config.reasoningEffort!,
                    level: value as 'low' | 'medium' | 'high',
                  },
                })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">{t('ugc-page.agents.create-dialog.reasoning-level-low')}</SelectItem>
                <SelectItem value="medium">{t('ugc-page.agents.create-dialog.reasoning-level-medium')}</SelectItem>
                <SelectItem value="high">{t('ugc-page.agents.create-dialog.reasoning-level-high')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Buttons */}
      <div className="flex justify-end space-x-3 pt-4">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
          >
            {t('ugc-page.agents.create-dialog.cancel')}
          </button>
        )}
        <button
          type="submit"
          className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
        >
          {t('ugc-page.agents.create-dialog.save')}
        </button>
      </div>
    </form>
  );
}
