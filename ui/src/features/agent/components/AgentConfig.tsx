/**
 * AgentConfig 组件 - Agent 配置界面
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useModelList } from '../hooks/useAgent';
import type { AgentConfig as AgentConfigType } from '../types/agent.types';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';

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
            {models.map((model) => (
              <SelectItem key={model.id} value={model.id}>
                <div className="flex flex-col items-start">
                  <span className="font-medium">{model.displayName || model.modelName}</span>
                  <span className="text-xs text-muted-foreground">{model.id}</span>
                </div>
              </SelectItem>
            ))}
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
