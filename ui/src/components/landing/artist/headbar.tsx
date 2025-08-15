import React from 'react';

import '@/styles/landing/artist.scss';

const ICON_URL = 'https://inf-monkeys.oss-cn-beijing.aliyuncs.com/monkeys-assets/artist/icon.svg';
const ICON_TITLE_URL = 'https://inf-monkeys.oss-cn-beijing.aliyuncs.com/monkeys-assets/artist/title.svg';

export const HeadBar: React.FC = () => {
  return (
    <div className="head-bar fixed left-0 top-0 w-full px-[30px] pt-[30px]">
      <div className="head-bar-content flex h-full items-center justify-between pb-[30px]">
        {/* LOGO */}
        <div className="logo ml-4 flex items-center gap-[10px] p-[1px]">
          <img className="size-[46px]" src={ICON_URL} alt="logo" />
          <img className="h-[36px]" src={ICON_TITLE_URL} alt="logo" />
        </div>
      </div>

      {/* 分割线 */}
      <div className="absolute bottom-0 h-[1px] w-[calc(100%-60px)]">
        <div className="head-bar-line size-full bg-white" />
      </div>
    </div>
  );
};
