import React from 'react';

import { useNavigate } from '@tanstack/react-router';

import '@/styles/landing/artist.scss';

import { HeadBar } from './headbar';
import { QuickAction } from './quick-action';
import { Rect } from './rect';

export const ArtistLandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="main-container">
      <HeadBar />

      <div className="content-container">
        <div className="content-bg z-0">
          <Rect />
          <div className="absolute bottom-[220px] right-[130px]">
            <Rect />
          </div>
        </div>

        <div className="content-content fixed z-10 flex flex-col">
          <div className="center-content flex flex-1 flex-col items-center justify-center">
            <div className="slogan cursor-default">Imagine it. Create it.</div>
            <div
              className="enter-button"
              onClick={() => {
                navigate({
                  to: '/',
                });
              }}
            >
              进入工作台
            </div>
            <div className="group">
              <div className="rectangle"></div>
              <div className="rectangle-1"></div>
            </div>
          </div>

          <div className="flex h-[410px] w-full justify-between gap-[30px] p-[30px]">
            {['画面分析', '局部修改', '灵感生成', '智能构图', '风格迁移', '方案构思'].map((item, index) => (
              <QuickAction
                key={`${index}`}
                iconUrl={`https://inf-monkeys.oss-cn-beijing.aliyuncs.com/monkeys-assets/artist/quick-actions/${item}/icon.svg`}
                titleUrl={`https://inf-monkeys.oss-cn-beijing.aliyuncs.com/monkeys-assets/artist/quick-actions/${item}/title.svg`}
                subtitleUrl={`https://inf-monkeys.oss-cn-beijing.aliyuncs.com/monkeys-assets/artist/quick-actions/${item}/subtitle.svg`}
                onClick={() => {
                  navigate({
                    to: '/',
                  });
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
