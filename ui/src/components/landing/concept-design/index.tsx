import React from 'react';

import { useNavigate } from '@tanstack/react-router';

import '@/styles/landing/concept-design.scss';

import { QuickAction } from './quick-action';

export const ConceptDesignLandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="concept-design-main-container flex flex-col px-[80px] py-[40px]">
      <div className="mt-[100px] flex h-[180px] items-center justify-between">
        <img
          className="h-full"
          src="https://inf-monkeys.oss-cn-beijing.aliyuncs.com/monkeys-assets/concept-design/title.svg"
          alt=""
        />
        <img
          className="h-full"
          src="https://inf-monkeys.oss-cn-beijing.aliyuncs.com/monkeys-assets/concept-design/title_tail.svg"
          alt=""
        />
      </div>

      <div className="flex-1" />

      <div className="mb-[60px] flex flex-col justify-center">
        <div className="flex gap-[18px]">
          <div className="cursor-pointer bg-gradient-to-b from-[#444444] to-[#000000] px-[20px] py-[24px]">
            <div className="flex h-[26px] items-center justify-center gap-[10px]">
              <img
                src="https://inf-monkeys.oss-cn-beijing.aliyuncs.com/monkeys-assets/concept-design/entry-actions/%E4%BB%8E%E8%AE%BE%E8%AE%A1%E6%A8%A1%E6%9D%BF%E5%87%BA%E5%8F%91.svg"
                alt=""
              />
              <img
                src="https://inf-monkeys.oss-cn-beijing.aliyuncs.com/monkeys-assets/concept-design/entry-actions/plus.svg"
                alt=""
              />
            </div>
          </div>
          <div className="cursor-pointer bg-[#ffffff] px-[20px] py-[24px]">
            <div className="flex h-[26px] items-center justify-center gap-[10px]">
              <img
                src="https://inf-monkeys.oss-cn-beijing.aliyuncs.com/monkeys-assets/concept-design/entry-actions/%E8%AE%BE%E8%AE%A1%E8%B5%84%E4%BA%A7.svg"
                alt=""
              />
              <img
                src="https://inf-monkeys.oss-cn-beijing.aliyuncs.com/monkeys-assets/concept-design/entry-actions/right.svg"
                alt=""
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-0">
        <img
          className="w-[96px]"
          src="https://inf-monkeys.oss-cn-beijing.aliyuncs.com/monkeys-assets/concept-design/others.svg"
          alt=""
        />

        <div className="flex gap-[22px]">
          {['设计工作台', '创新方法识别', '灵感激发', '逻辑关系发现'].map((item, index) => (
            <QuickAction
              key={`${index}`}
              cardUrl={`https://inf-monkeys.oss-cn-beijing.aliyuncs.com/monkeys-assets/concept-design/quick-actions/${item}/card.svg`}
              onClick={() => {
                navigate({
                  to: '/',
                });
              }}
            />
          ))}
        </div>
      </div>

      <div className="z-1 fixed bottom-[390px] left-0 h-[1.5px] w-full bg-[#ACACAC] shadow-md"></div>
      <div className="z-1 fixed bottom-0 left-[80px] h-[492px] w-[1.5px] bg-[#ACACAC] shadow-md"></div>
    </div>
  );
};
