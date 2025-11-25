import React, { useMemo, useState } from 'react';

import { Check, Sparkles, Wand2 } from 'lucide-react';

import { BsdAssistantIcon } from '@/components/icons/BsdAssistantIcon';
import { BsdImageIcon } from '@/components/icons/BsdImageIcon';
import { BsdLightIcon } from '@/components/icons/BsdLightIcon';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/utils';

export type InspirationGenerationOptions = {
  title?: string;
  description?: string;
  scenarios?: string[];
  categories?: string[];
  flavors?: string[];
  prompt?: string;
  models?: Array<{
    id: string;
    title: string;
    subtitle?: string;
    cover?: string;
    type?: string;
  }>;
};

const defaultOptions: InspirationGenerationOptions = {
  title: '创意描述',
  description: '通过文字描述生成图片或使用提示词字典提升生成效果',
  scenarios: ['户外', '都市', '休闲'],
  categories: ['羽绒服', '针织衫', '大衣'],
  flavors: ['更多'],
  prompt:
    '适合35岁成熟商务女性的长款羽绒服，优雅大气设计，略微宽松的流畅修身廓形，立体裁剪技法，高品质防风面料，轻盈保暖羽绒填充，柔软亲肤内衬，精致手工缝制细节，经典立领设计，高级灰色调，强调职场自信与从容气质。',
  models: [
    { id: 'style', title: '风格 Style', subtitle: 'Style' },
    { id: 'brand', title: '品牌 Brand', subtitle: 'Brand' },
  ],
};

const allowedModelIds = ['style', 'brand'];

const SelectField: React.FC<{
  label: string;
  options?: string[];
  value?: string;
  onChange: (value: string) => void;
}> = ({ label, options = [], value, onChange }) => {
  if (!options.length) return null;
  const resolvedValue = value ?? options[0];

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-2">
      <p
        className="text-white"
        style={{ fontFamily: 'Noto Sans SC', fontSize: 14, fontWeight: 400, lineHeight: '140%', color: 'rgba(255,255,255,0.6)' }}
      >
        {label}
      </p>
      <Select value={resolvedValue} onValueChange={onChange}>
        <SelectTrigger
          className="flex h-11 w-full items-center rounded-2xl border border-white/20 px-4 text-left text-sm text-white transition hover:border-white/30 focus:border-white/40 focus:ring-0 [&>span]:flex [&>span]:h-full [&>span]:w-full [&>span]:items-center [&>span]:font-['Noto_Sans_SC'] [&>span]:text-[14px] [&>span]:font-normal [&>span]:leading-[140%] [&>span]:tracking-[0em] [&>span]:text-white [&>span[data-placeholder]]:text-white/50"
          style={{ background: 'rgba(44, 94, 245, 0.15)' }}
        >
          <SelectValue placeholder={`请选择${label}`} />
        </SelectTrigger>
        <SelectContent className="border-white/10 bg-slate-900/95 text-white" position="popper">
          {options.map((option) => (
            <SelectItem
              key={option}
              value={option}
              className="text-sm text-white data-[state=checked]:bg-white data-[state=checked]:text-slate-900"
            >
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

const ModelCard: React.FC<{
  title: string;
  subtitle?: string;
  active?: boolean;
  onClick: () => void;
}> = ({ title, subtitle, active, onClick }) => (
  <button
    onClick={onClick}
    className={cn(
      'relative flex h-32 w-full items-center justify-center overflow-hidden rounded-2xl border bg-cover bg-center text-lg font-semibold text-white transition',
      active
        ? 'border-[#6ea2ff] shadow-[0_0_25px_rgba(96,165,250,0.35)]'
        : 'border-white/10 bg-gradient-to-r from-slate-500/60 to-slate-800/60 hover:border-white/30',
    )}
  >
    <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-black/50" />
    <span className="relative z-10 flex flex-col items-center gap-1">
      {title}
      {subtitle && <span className="rounded-full bg-white/20 px-3 py-0.5 text-xs text-white/90">{subtitle}</span>}
    </span>
    {active && (
      <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-medium text-slate-800">
        <Check className="size-3" /> 已选
      </span>
    )}
  </button>
);

export interface InspirationGenerationPanelProps {
  options?: InspirationGenerationOptions;
}

export const InspirationGenerationPanel: React.FC<InspirationGenerationPanelProps> = ({ options }) => {
  const resolvedOptions = useMemo(() => ({ ...defaultOptions, ...options }), [options]);

  const [scenario, setScenario] = useState(resolvedOptions.scenarios?.[0]);
  const [category, setCategory] = useState(resolvedOptions.categories?.[0]);
  const [prompt, setPrompt] = useState(resolvedOptions.prompt ?? '');
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [showDictionary, setShowDictionary] = useState(false);

  const displayedModels = useMemo(
    () => (resolvedOptions.models ?? []).filter((model) => allowedModelIds.includes(model.id)).slice(0, 2),
    [resolvedOptions.models],
  );

  const toggleModel = (modelId: string) => {
    setSelectedModels((prev) => (prev.includes(modelId) ? prev.filter((id) => id !== modelId) : [...prev, modelId]));
  };

  return (
    <div className="flex w-full max-w-xl flex-col gap-4 overflow-y-auto pr-1">
      <section
        className="flex flex-col gap-3 rounded-[15px] bg-white/10 border border-[rgba(255,255,255,0.1)] transition-colors duration-400 hover:border-white/40"
        style={{ padding: 12 }}
      >
        <header className="flex items-center justify-between">
          <div>
            <p
              className="flex items-center gap-2 text-white"
              style={{ fontFamily: 'Noto Sans SC', fontSize: 16, fontWeight: 500, lineHeight: '140%' }}
            >
              <BsdLightIcon className="size-5" />
              {resolvedOptions.title}
            </p>
            <p
              className="mt-1 text-white"
              style={{ fontFamily: 'Noto Sans SC', fontSize: 12, fontWeight: 400, lineHeight: '140%', color: 'rgba(255,255,255,0.4)' }}
            >
              {resolvedOptions.description}
            </p>
            </div>
        </header>

        <div className="mt-3 flex gap-4">
          <SelectField label="场景" options={resolvedOptions.scenarios} value={scenario} onChange={setScenario} />
          <SelectField label="品类" options={resolvedOptions.categories} value={category} onChange={setCategory} />
          <div className="flex min-w-0 flex-1 flex-col gap-3">
            <p
              className="text-white"
              style={{ fontFamily: 'Noto Sans SC', fontSize: 14, fontWeight: 400, lineHeight: '140%', color: 'rgba(255,255,255,0.6)' }}
            >
              更多
            </p>
            <button
              type="button"
              onClick={() => setShowDictionary((prev) => !prev)}
              className={cn(
                'inline-flex items-center justify-center gap-2 rounded-2xl border border-white/20 px-4 py-2 text-sm font-medium transition',
                showDictionary ? 'bg-white text-slate-900' : 'bg-white/10 text-white hover:bg-white/20',
              )}
            >
              <Wand2 className="size-4" /> 提示词字典
            </button>
          </div>
        </div>

        <div
          className="rounded-2xl border border-white/15 p-4 transition-colors duration-400 hover:border-white/40"
          style={{ background: 'rgba(255, 255, 255, 0.1)' }}
        >
          <textarea
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            rows={6}
            className="h-40 w-full resize-none bg-transparent text-sm leading-relaxed text-white placeholder:text-white/40 focus:outline-none"
            placeholder="请输入创意描述"
          />
          <div className="mt-2 flex items-center justify-start text-xs text-white/60">
            <button className="inline-flex items-center gap-2 text-white/70">
              <BsdAssistantIcon className="h-6 w-6" />
              提示词助手
            </button>
          </div>
        </div>
      </section>

      <section
        className="flex flex-col gap-4 rounded-[15px] bg-white/10 border border-[rgba(255,255,255,0.1)] transition-colors duration-400 hover:border-white/40"
        style={{ padding: 12 }}
      >
        <header className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <BsdImageIcon className="size-5" />
            <p
              className="text-white"
              style={{ fontFamily: 'Noto Sans SC', fontSize: 16, fontWeight: 500, lineHeight: '140%' }}
            >
              个性化模型（可选）
            </p>
          </div>
          <p
            className="text-white"
            style={{ fontFamily: 'Noto Sans SC', fontSize: 12, fontWeight: 400, lineHeight: '140%', color: 'rgba(255,255,255,0.4)' }}
          >
            包含“风格/品牌”，点击后在下方弹出选择（最多三个）
            </p>
        </header>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {displayedModels.map((model) => (
            <ModelCard
              key={model.id}
              title={model.title}
              subtitle={model.subtitle}
              active={selectedModels.includes(model.id)}
              onClick={() => toggleModel(model.id)}
            />
          ))}
        </div>
      </section>

      <div className="mt-2 flex w-full justify-center">
        <button
          type="button"
          className="relative flex h-[42px] w-full items-center justify-center gap-2 overflow-hidden rounded-[10px] px-5 text-white transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
          style={{
            background:
              'linear-gradient(0deg, rgba(40, 82, 173, 0.08), rgba(40, 82, 173, 0.08)), #2C5EF5',
            
          }}
        >
          <span className="pointer-events-none absolute bottom-0 left-1/2 h-2 w-2/3 -translate-x-1/2 translate-y-[6px] rounded-full bg-white/60 blur-[12px]" />
          <Sparkles className="size-5" stroke="none" fill="#FFFFFF" />
          <span
            style={{
              fontFamily: 'Microsoft YaHei UI, Microsoft YaHei, Alibaba PuHuiTi 3.0, sans-serif',
              fontSize: 16,
              fontWeight: 700,
              lineHeight: '20px',
              letterSpacing: '0em',
              color: '#FFFFFF',
              fontVariationSettings: '"opsz" auto',
              fontFeatureSettings: '"kern" on',
              textShadow: '0 1px 6px rgba(0, 0, 0, 0.25)',
            }}
          >
            开始生图
          </span>
        </button>
      </div>
    </div>
  );
};
