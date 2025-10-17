import React, { useEffect, useState } from 'react';

import { useNavigate } from '@tanstack/react-router';

import '@/styles/landing/artist.scss';

import { isAuthed } from '@/components/router/guard/auth';
import { useVinesUser } from '@/components/router/guard/user';

const ICON_URL = 'https://inf-monkeys.oss-cn-beijing.aliyuncs.com/monkeys-assets/artist/icon.svg';
const ICON_TITLE_URL =
  'https://inf-monkeys.oss-cn-beijing.aliyuncs.com/monkeys-assets/artist/title%E8%89%BA%E6%9C%AF%E5%AE%B6.svg';

export const HeadBar: React.FC = () => {
  const navigate = useNavigate();
  const { userPhoto, userName } = useVinesUser();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // 检查认证状态
  useEffect(() => {
    setIsAuthenticated(isAuthed());
  }, []);

  const handleLogin = () => {
    navigate({
      to: '/login',
    });
  };

  const handleUserClick = () => {
    // 可以跳转到用户设置页面或其他相关页面
    navigate({
      to: '/',
    });
  };

  return (
    <div className="head-bar fixed left-0 top-0 w-full px-[30px] pt-[30px]">
      <div className="head-bar-content flex h-full items-center justify-between pb-[30px]">
        {/* LOGO */}
        <div className="logo ml-4 flex items-center gap-[10px] p-[1px]">
          <img className="size-[46px]" src={ICON_URL} alt="logo" />
          <img className="h-[36px]" src={ICON_TITLE_URL} alt="logo" />
        </div>

        {/* 登录按钮或用户头像 */}
        <div className="login-section mr-4">
          {isAuthenticated ? (
            <div className="user-avatar cursor-pointer" onClick={handleUserClick}>
              <img
                className="size-[40px] rounded-full border-2 border-white/20"
                src={userPhoto}
                alt={userName}
                title={userName}
              />
            </div>
          ) : (
            <button className="login-button" onClick={handleLogin}>
              登录
            </button>
          )}
        </div>
      </div>

      {/* 分割线 */}
      <div className="absolute bottom-0 h-[1px] w-[calc(100%-60px)]">
        <div className="head-bar-line size-full bg-white" />
      </div>
    </div>
  );
};
