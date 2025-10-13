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

        setSvgContent(modifiedSvg);
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

  // 定义图标的颜色模式（使用正则替换）
  const iconColorMode: ColorMode = {
    mode: 'regex',
    colors: {
      primary: isHovered ? '#B71E1E' : '#575757',
      secondary: isHovered ? '#8B0000' : '#151515',
    },
  };

  // 定义文本的颜色模式（使用 fill 替换）
  const titleColorMode: ColorMode = {
    mode: 'fill',
    colors: {
      primary: isHovered ? '#8B0000' : 'white',
      secondary: isHovered ? '#8B0000' : 'white',
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
      className="quick-action relative flex size-full cursor-pointer flex-col justify-end overflow-hidden rounded-2xl px-[20px] py-[26px]"
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
          isHovered ? '!bg-[#8B0000ff]' : '!bg-[#ffffff00]',
        )}
      >
        <ArrowUpRight size={40} color="#ffffff80" />
      </motion.div>

      {/* 右下角大图标 */}
      <motion.div className="pointer-events-none absolute bottom-[120px] right-[200px] size-[120px] z-10">
        <RemoteSvg
          url={iconUrl}
          className="h-full w-full"
          colorMode={iconColorMode}
          uniqueKey={key} // 传入唯一标识
        />
      </motion.div>

      {/* 文本 */}
      <div className="flex flex-col gap-6 z-10">
        <RemoteSvg
          url={titleUrl}
          className="h-6"
          colorMode={titleColorMode}
          uniqueKey={`${key}-title`} // 为标题添加唯一标识
        />
        <RemoteSvg
          url={subtitleUrl}
          className="h-4"
          colorMode={subtitleColorMode}
          uniqueKey={`${key}-subtitle`} // 为副标题添加唯一标识
        />
      </div>
    </motion.div>
  );
};
