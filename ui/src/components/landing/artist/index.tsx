import React from 'react';

import { useNavigate } from '@tanstack/react-router';

import '@/styles/landing/artist.scss';

import { isAuthed } from '@/components/router/guard/auth';

import { DynamicBackground } from './dynamic-background';
import { HeadBar } from './headbar';
import { QuickAction } from './quick-action';

export const ArtistLandingPage: React.FC = () => {
  const navigate = useNavigate();

  const handleToWorkbench = () => {
    isAuthed()
      ? navigate({
          to: '/',
        })
      : navigate({
          to: '/login',
        });
  };

  return (
    <div className="artist-main-container">
      {/* 全屏动态背景 */}
      <DynamicBackground />
      
      <HeadBar />

      <div className="content-container">
        <div className="content-content fixed z-10 flex flex-col">
          <div className="slogan-section">
            <img 
              src="https://inf-monkeys.oss-cn-beijing.aliyuncs.com/icons/artist/home.svg" 
              alt="slogan" 
              className="slogan-icon"
            />
            <div className="enter-button" onClick={handleToWorkbench}>
              进入设计项目
            </div>
          </div>
          
          <div className="center-content flex flex-1 flex-col items-center justify-center">
            {/* 内容区域 */}
          </div>

          <div className="flex h-[410px] w-full justify-between gap-[30px] p-[30px]">
            {['画面分析', '局部修改', '灵感生成', '智能构图', '风格迁移', '方案构思'].map((item, index) => (
              <QuickAction
                key={`${index}`}
                iconUrl={`https://inf-monkeys.oss-cn-beijing.aliyuncs.com/monkeys-assets/artist/quick-actions/${item}/icon.svg`}
                titleUrl={`https://inf-monkeys.oss-cn-beijing.aliyuncs.com/monkeys-assets/artist/quick-actions/${item}/title.svg`}
                subtitleUrl={`https://inf-monkeys.oss-cn-beijing.aliyuncs.com/monkeys-assets/artist/quick-actions/${item}/subtitle.svg`}
                onClick={handleToWorkbench}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
