import React, { useEffect, useState } from 'react';

import '@/styles/landing/artist.scss';

import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';

import { cn } from '@/utils';
import ButtonBackgroundSvg from './quick-actions/ButtonBackground.svg';

// 定义颜色替换模式
type ColorMode = {
  mode: 'fill' | 'regex';
  colors: {
    primary: string;
    secondary: string;
  };
};

// 针对不同按钮的图标位置和尺寸映射（可按需微调）
const ICON_CLASS_MAP: Record<string, string> = {
  '意图表达': 'bottom-[40px] right-[190px] size-[210px]',
  '一键生成': 'bottom-[100px] right-[120px] size-[130px]',
  '智能修改': 'bottom-[120px] right-[210px] size-[120px]',
};

// 从资源路径中解析出按钮名称（quick-actions/名称/icon.svg）
function getActionNameFromUrl(url: string): string | undefined {
  try {
    const decoded = decodeURIComponent(url);
    const parts = decoded.split('/');
    const idx = parts.findIndex((p) => p === 'quick-actions');
    if (idx !== -1 && parts[idx + 1]) {
      return parts[idx + 1];
    }
  } catch {}
  return undefined;
}

// 创建一个通用的 RemoteSvg 组件
const RemoteSvg: React.FC<{
  url: string;
  className?: string;
  colorMode?: ColorMode;
  uniqueKey?: string; // 添加唯一标识
}> = ({ url, className, colorMode, uniqueKey }) => {
  // 使用 URL + uniqueKey 作为缓存 key
  const cacheKey = `${url}-${uniqueKey}`;
  const [svgContent, setSvgContent] = useState<string>('');

  // 为 SVG 内部 id 及其引用加命名空间，避免多个实例之间的 id 冲突
  const namespaceSvgIds = (text: string, ns: string | undefined) => {
    if (!ns) return text;
    // 先替换 id="xxx"
    let result = text.replace(/id="([^"]+)"/g, (_m, id) => `id="${ns}-${id}"`);
    // 再替换 url(#xxx)
    result = result.replace(/url\(#([^\)]+)\)/g, (_m, id) => `url(#${ns}-${id})`);
    // 再替换 xlink:href="#xxx" 或 href="#xxx"
    result = result.replace(/(xlink:href|href)="#([^"]+)"/g, (_m, attr, id) => `${attr}="#${ns}-${id}"`);
    return result;
  };

  useEffect(() => {
    fetch(url)
      .then((res) => res.text())
      .then((text) => {
        if (!colorMode) {
          setSvgContent(text);
          return;
        }

        let modifiedSvg = text;

        if (colorMode.mode === 'fill') {
          modifiedSvg = text.replace(/fill="[^"]*"/g, `fill="${colorMode.colors.primary}"`);
        } else if (colorMode.mode === 'regex') {
          modifiedSvg = text
            .replace(/#575757/g, colorMode.colors.primary)
            .replace(/#151515/g, colorMode.colors.secondary);
        }

        // 给 id 加命名空间，防止多个按钮间互相引用导致联动
        const namespaced = namespaceSvgIds(modifiedSvg, uniqueKey);
        setSvgContent(namespaced);
      });
  }, [url, colorMode, cacheKey]); // 添加 cacheKey 作为依赖

  return <div className={className} dangerouslySetInnerHTML={{ __html: svgContent }} />;
};

// 在 QuickAction 组件中使用
export const QuickAction: React.FC<{
  iconUrl: string;
  titleUrl: string;
  subtitleUrl: string;
  key: string;
  onClick?: () => void;
}> = ({ iconUrl, titleUrl, subtitleUrl, key, onClick }) => {
  const [isHovered, setIsHovered] = useState(false);
  const actionName = getActionNameFromUrl(iconUrl) || '意图表达';
  const uniqueBase = `qa-${actionName}`;

  // 定义图标的颜色模式（使用正则替换）
  const iconColorMode: ColorMode = {
    mode: 'regex',
    colors: {
      primary: isHovered ? '#4D8F9D' : '#575757',
      secondary: isHovered ? '#416887' : '#151515',
    },
  };

  // 定义文本的颜色模式（使用 fill 替换）
  const titleColorMode: ColorMode = {
    mode: 'fill',
    colors: {
      primary: isHovered ? '#416887' : 'white',
      secondary: isHovered ? '#416887' : 'white',
    },
  };

  const subtitleColorMode: ColorMode = {
    mode: 'fill',
    colors: {
      primary: isHovered ? 'black' : 'white',
      secondary: isHovered ? 'black' : 'white',
    },
  };

  return (
    <motion.div
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={onClick}
      className="quick-action isolate relative flex size-full cursor-pointer flex-col justify-end overflow-hidden rounded-2xl px-[20px] py-[26px]"
      key={`landing-artist-quick-action-${key}`}
    >
      {/* 背景 SVG */}
      <div className="absolute inset-0 w-full h-full">
        <img 
          src={ButtonBackgroundSvg} 
          alt="Button Background" 
          className="w-full h-full object-cover"
        />
      </div>
      
      {/* 箭头 */}
      <motion.div
        className={cn(
          'absolute right-3 top-3 flex size-[40px] items-center justify-center rounded-full z-10',
          isHovered ? '!bg-[#416887ff]' : '!bg-[#ffffff00]',
        )}
      >
        <ArrowUpRight size={40} color="#ffffff80" />
      </motion.div>

      {/* 右下角大图标（根据按钮类型动态定位与尺寸） */}
      <motion.div
        className={cn(
          'pointer-events-none absolute z-10 mix-blend-normal',
          ICON_CLASS_MAP[actionName] || 'bottom-[120px] right-[200px] size-[120px]'
        )}
      >
        <RemoteSvg
          url={iconUrl}
          className="h-full w-full"
          colorMode={iconColorMode}
          uniqueKey={`${uniqueBase}-icon`} // 传入唯一标识
        />
      </motion.div>

      {/* 文本 */}
      <div className="flex flex-col gap-6 z-10 mix-blend-normal">
        <RemoteSvg
          url={titleUrl}
          className="h-6"
          colorMode={titleColorMode}
          uniqueKey={`${uniqueBase}-title`} // 为标题添加唯一标识
        />
        <RemoteSvg
          url={subtitleUrl}
          className="h-4"
          colorMode={subtitleColorMode}
          uniqueKey={`${uniqueBase}-subtitle`} // 为副标题添加唯一标识
        />
      </div>
    </motion.div>
  );
};
