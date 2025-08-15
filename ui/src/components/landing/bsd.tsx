import React, { useEffect, useState } from 'react';

import { useNavigate } from '@tanstack/react-router';

import { motion } from 'framer-motion';
import { LogIn, Sparkles, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useUser } from '@/apis/authz/user';
import { isAuthed } from '@/components/router/guard/auth';
import { useVinesTeam } from '@/components/router/guard/team.tsx';
import { Button } from '@/components/ui/button';
import VinesEvent from '@/utils/events.ts';

// 轮播卡片数据
const carouselData = [
  {
    id: 1,
    title: '设计智能体',
    subtitle: '核心情求高度解析',
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=600&fit=crop',
  },
  {
    id: 2,
    title: '灵感生成',
    subtitle: '核心情求高度解析',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=600&fit=crop',
  },
  {
    id: 3,
    title: '自由裂变',
    subtitle: '核心情求高度解析',
    image: 'https://images.unsplash.com/photo-1515378960530-7c0da6231fb1?w=400&h=600&fit=crop',
  },
  {
    id: 4,
    title: '风格融合',
    subtitle: '核心情求高度解析',
    image: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=400&h=600&fit=crop',
  },
  {
    id: 5,
    title: '局部修改',
    subtitle: '核心情求高度解析',
    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=600&fit=crop',
  },
  {
    id: 6,
    title: 'AI工具箱',
    subtitle: '可同时的灵感设计',
    image: 'https://images.unsplash.com/photo-1509909756405-be0199881695?w=400&h=600&fit=crop',
  },
];

export const BSDLandingPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  const { data: user, isLoading: isUserLoading } = useUser();
  const { teamId, teams } = useVinesTeam();
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // 检查认证状态
  useEffect(() => {
    setIsAuthenticated(!!isAuthed());
  }, []);

  // 处理团队跳转逻辑（如已登录且有团队）
  useEffect(() => {
    if (isAuthenticated && teams?.length && user) {
      // 如果用户已登录且有团队，可以选择是否自动跳转
      // 这里暂时不自动跳转，让用户可以查看 landing page
      // 如需自动跳转，取消下面的注释
      /*
      const finalTeamId = teamId ? teamId : teams[0].id;
      localStorage.setItem('vines-team-id', finalTeamId);
      window['vinesTeamId'] = finalTeamId;
      void navigate({
        to: '/$teamId/',
        params: {
          teamId: finalTeamId,
        },
      });
      */
    }
  }, [isAuthenticated, teamId, teams, user, navigate]);

  // 自动播放轮播
  useEffect(() => {
    if (!isAutoPlaying) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % carouselData.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const handlePrev = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev - 1 + carouselData.length) % carouselData.length);
  };

  const handleNext = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev + 1) % carouselData.length);
  };

  // 处理进入工作台
  const handleEnterWorkspace = () => {
    if (!isAuthenticated) {
      VinesEvent.emit('vines-nav', '/login');
      return;
    }
    
    if (teams?.length) {
      const finalTeamId = teamId ? teamId : teams[0].id;
      localStorage.setItem('vines-team-id', finalTeamId);
      window['vinesTeamId'] = finalTeamId;
      void navigate({
        to: '/$teamId/',
        params: {
          teamId: finalTeamId,
        },
      });
    }
  };

  // 处理登录
  const handleLogin = () => {
    VinesEvent.emit('vines-nav', '/login');
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-black">
      {/* 顶部导航栏 - 独立背景 */}
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-30 flex items-center justify-between px-4 py-4 sm:px-8 sm:py-6 bg-black/80 backdrop-blur-sm border-b border-white/10"
      >
        <div className="flex items-center">
          <img
            src="https://inf-monkeys.oss-cn-beijing.aliyuncs.com/monkeys-assets/bsd/bsd.ai.svg"
            alt="BSD AI"
            className="h-20 w-auto sm:h-25 -my-2 sm:-my-3"
          />
        </div>
        
        {/* 用户头像 */}
        {isAuthenticated && user ? (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-purple-500 sm:h-12 sm:w-12">
            {user.photo ? (
              <img
                src={user.photo}
                alt={user.name || ''}
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              <User className="h-5 w-5 text-white sm:h-6 sm:w-6" />
            )}
          </div>
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-blue-500 sm:h-12 sm:w-12">
            <Sparkles className="h-5 w-5 text-white sm:h-6 sm:w-6" />
          </div>
        )}
      </motion.header>

      {/* 页面背景 - 从 headbar 下方开始 */}
      <div
        className="absolute inset-x-0 top-[88px] bottom-0"
        style={{
          backgroundImage: `url('https://inf-monkeys.oss-cn-beijing.aliyuncs.com/monkeys-assets/bsd/background.svg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center top',
          backgroundRepeat: 'no-repeat'
        }}
      />

      {/* 主要内容区 */}
      <div className="relative z-10 flex min-h-[calc(100vh-88px)] flex-col items-center px-4 pb-8 sm:px-8 pt-0">
        {/* 标题和按钮区域 */}
        <div className="flex flex-col items-center text-center" style={{ marginTop: '60px' }}>
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
            className="mb-6 flex items-center justify-center sm:mb-8"
          >
            <img
              src="https://inf-monkeys.oss-cn-beijing.aliyuncs.com/monkeys-assets/bsd/%E5%B1%B1%E5%B7%9D%E5%88%B0%E6%9E%81%E5%9C%B0.svg"
              alt="从山川到极地的风格指南"
              className="h-auto w-full max-w-2xl px-4 sm:px-0 md:max-w-3xl lg:max-w-4xl xl:max-w-5xl"
            />
          </motion.div>

          {/* 标签区域 */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mb-8 flex flex-wrap items-center justify-center gap-3 text-white/70 sm:mb-12 sm:gap-6"
          >
            <span className="text-base sm:text-lg">懂设计</span>
            <span className="hidden text-gray-500 sm:inline">|</span>
            <span className="text-base sm:text-lg">知市场</span>
            <span className="hidden text-gray-500 sm:inline">|</span>
            <span className="text-base sm:text-lg">通工艺</span>
            <span className="hidden text-gray-500 sm:inline">|</span>
            <span className="text-base sm:text-lg">助营销</span>
          </motion.div>

          {/* 按钮组 */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="flex flex-col gap-[80px] px-4 sm:flex-row sm:px-0"
          >
            {isAuthenticated ? (
              <>
                                                                   <Button
                    size="large"
                    onClick={handleEnterWorkspace}
                    className="group relative w-[293px] h-[80px] overflow-hidden rounded-[15px] border-[1.5px] border-white/10 px-5 py-0 text-[24px] font-medium backdrop-blur-[30px] transition-all hover:scale-105 hover:border-white/20"
                   style={{
                     background: 'linear-gradient(0deg, rgba(40, 82,173, 0.08), rgba(40, 82, 173,0.08)), #171717',
                     boxShadow: 'inset 4px 4px 8.7px 0px rgba(255, 255, 255, 0.25)'
                   }}
                   onMouseEnter={(e) => {
                     e.currentTarget.style.background = '#03072D';
                     e.currentTarget.style.border = '1.5px solid rgba(144, 166, 231, 0.8)';
                     e.currentTarget.style.boxShadow = 'inset 11px -12px 13.7px 0px rgba(144, 166, 231,0.5), 0 0 20px rgba(144, 166, 231, 0.6)';
                   }}
                   onMouseLeave={(e) => {
                     e.currentTarget.style.background = 'linear-gradient(0deg, rgba(40, 82,173, 0.08), rgba(40, 82, 173,0.08)), #171717';
                     e.currentTarget.style.border = '1.5px solid rgba(255, 255, 255, 0.1)';
                     e.currentTarget.style.boxShadow = 'inset 4px 4px 8.7px 0px rgba(255, 255, 255, 0.25)';
                   }}
                 >
                  <span 
                    className="relative z-10 flex items-center justify-between w-full"
                    style={{
                      background: 'linear-gradient(270deg, #9AB3FF 0%, rgba(180, 169, 245, 0) 100%), #FFFFFF',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text'
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <img 
                        src="https://inf-monkeys.oss-cn-beijing.aliyuncs.com/monkeys-assets/bsd/%E5%89%8D%E6%B2%BF%E8%B5%84%E8%AE%AF.svg"
                        alt="出款"
                        className="h-4 w-4 sm:h-5 sm:w-5"
                      />
                      {t('auth.enter-workspace', { defaultValue: '前沿资讯' })}
                    </div>
                    <div className="relative">
                      <img 
                        src="https://inf-monkeys.oss-cn-beijing.aliyuncs.com/monkeys-assets/bsd/%E7%AE%AD%E5%A4%B42.svg"
                        alt="箭头"
                        className="h-4 w-4 sm:h-5 sm:w-5 transition-opacity duration-200 group-hover:opacity-0"
                      />
                      <img 
                        src="https://inf-monkeys.oss-cn-beijing.aliyuncs.com/monkeys-assets/bsd/%E7%AE%AD%E5%A4%B41.svg"
                        alt="箭头"
                        className="absolute inset-0 h-4 w-4 sm:h-5 sm:w-5 opacity-0 transition-all duration-200 group-hover:opacity-100 group-hover:scale-150"
                      />
                    </div>
                  </span>
                </Button>

                                                                   <Button
                    size="large"
                    variant="outline"
                    className="w-[293px] h-[80px] rounded-[15px] border-[1.5px] border-white/10 px-5 py-0 text-[24px] font-medium backdrop-blur-[30px] transition-all hover:scale-105 hover:border-white/20"
                   style={{
                     background: 'linear-gradient(0deg, rgba(40, 82,173, 0.08), rgba(40, 82, 173,0.08)), #171717',
                     boxShadow: 'inset 4px 4px 8.7px 0px rgba(255, 255, 255, 0.25)'
                   }}
                   onMouseEnter={(e) => {
                     e.currentTarget.style.background = '#03072D';
                     e.currentTarget.style.border = '1.5px solid rgba(144, 166, 231, 0.8)';
                     e.currentTarget.style.boxShadow = 'inset 11px -12px 13.7px 0px rgba(144, 166, 231,0.5), 0 0 20px rgba(144, 166, 231, 0.6)';
                   }}
                   onMouseLeave={(e) => {
                     e.currentTarget.style.background = 'linear-gradient(0deg, rgba(40, 82,173, 0.08), rgba(40, 82, 173,0.08)), #171717';
                     e.currentTarget.style.border = '1.5px solid rgba(255, 255, 255, 0.1)';
                     e.currentTarget.style.boxShadow = 'inset 4px 4px 8.7px 0px rgba(255, 255, 255, 0.25)';
                   }}
                 >
                  <span 
                    className="flex items-center justify-between w-full group"
                    style={{
                      background: 'linear-gradient(270deg, #9AB3FF 0%, rgba(180, 169, 245, 0) 100%), #FFFFFF',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text'
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <img 
                        src="https://inf-monkeys.oss-cn-beijing.aliyuncs.com/monkeys-assets/bsd/%E8%AE%BE%E8%AE%A1%E6%99%BA%E8%83%BD%E4%BD%93.png"
                        alt="设计智能体"
                        className="h-4 w-4 sm:h-5 sm:w-5"
                      />
                      <span>设计智能体</span>
                    </div>
                    <div className="relative">
                      <img 
                        src="https://inf-monkeys.oss-cn-beijing.aliyuncs.com/monkeys-assets/bsd/%E7%AE%AD%E5%A4%B42.svg"
                        alt="箭头"
                        className="h-4 w-4 sm:h-5 sm:w-5 transition-opacity duration-200 group-hover:opacity-0"
                      />
                      <img 
                        src="https://inf-monkeys.oss-cn-beijing.aliyuncs.com/monkeys-assets/bsd/%E7%AE%AD%E5%A4%B41.svg"
                        alt="箭头"
                        className="absolute inset-0 h-4 w-4 sm:h-5 sm:w-5 opacity-0 transition-all duration-200 group-hover:opacity-100 group-hover:scale-150"
                      />
                    </div>
                  </span>
                </Button>
              </>
            ) : (
              <>
                <Button
                  size="large"
                  onClick={handleLogin}
                  className="group relative w-[260px] h-[77px] overflow-hidden rounded-[15px] border-[1.5px] border-white/10 bg-gradient-to-b from-[rgba(69,69,69,0.35)] to-[rgba(40,40,40,0.25)] px-5 py-0 text-[24px] font-medium backdrop-blur-[30px] shadow-[4px_0px_10px_0px_rgba(23,23,23,0.3)] transition-all hover:scale-105 hover:bg-gradient-to-b hover:from-[rgba(69,69,69,0.5)] hover:to-[rgba(40,40,40,0.4)] hover:border-white/20"
                >
                  <span 
                    className="relative z-10 flex items-center justify-start gap-2"
                    style={{
                      background: 'linear-gradient(270deg, #9AB3FF 0%, rgba(180, 169, 245, 0) 100%), #FFFFFF',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text'
                    }}
                  >
                    <LogIn className="h-4 w-4 sm:h-5 sm:w-5" />
                    {t('auth.login', { defaultValue: '立即登录' })}
                  </span>
                </Button>

                <Button
                  size="large"
                  variant="outline"
                  className="w-[260px] h-[77px] rounded-[15px] border-[1.5px] border-white/10 bg-gradient-to-b from-[rgba(69,69,69,0.35)] to-[rgba(40,40,40,0.25)] px-5 py-0 text-[24px] font-medium backdrop-blur-[30px] shadow-[4px_0px_10px_0px_rgba(23,23,23,0.3)] transition-all hover:scale-105 hover:bg-gradient-to-b hover:from-[rgba(69,69,69,0.5)] hover:to-[rgba(40,40,40,0.4)] hover:border-white/20"
                >
                  <span 
                    className="flex justify-start w-full group"
                    style={{
                      background: 'linear-gradient(270deg, #9AB3FF 0%, rgba(180, 169, 245, 0) 100%), #FFFFFF',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text'
                    }}
                  >
                    了解更多
                  </span>
                </Button>
              </>
            )}
          </motion.div>

          {/* 新增卡片区域 */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="mt-[100px] flex items-end justify-center gap-6 w-[1758px]"
          >
            

                                                                                  {/* Card 1: 灵感生成 */}
               <div 
                 className="group relative flex flex-col origin-bottom overflow-hidden transition-all duration-300 hover:w-[295px] hover:h-[396px] hover:scale-105 rounded-[20px]"
                 style={{
                   position: 'static',
                   left: '0px',
                   top: '30px',
                   width: '273px',
                   height: '366px',
                   borderRadius: '20px',
                   opacity: 1,
                   background: 'linear-gradient(0deg, rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.3)), linear-gradient(168deg, rgba(23, 23, 23, 0) 35%, rgba(39, 77, 189, 0.715) 72%, #2D62FF 87%)',
                   boxSizing: 'border-box',
                   border: '1px solid rgba(18, 220, 255, 0.6)',
                   backdropFilter: 'blur(32px)',
                   zIndex: 0,
                 }}
               >
               {/* Background overlay with blend mode */}
               <div
                 className="absolute"
                 style={{
                   position: 'absolute',
                   left: '77.5px',
                   top: '92px',
                   width: '248px',
                   height: '276px',
                   mixBlendMode: 'screen',
                   opacity: 1,
                   display: 'flex',
                   flexDirection: undefined,
                   justifyContent: undefined,
                   alignItems: undefined,
                   padding: 'NaNpx',
                   background: 'url(image.png)',
                   filter: 'opacity(0.6000000238418579)',
                 }}
               />
                               <div className="relative w-full h-48 group-hover:h-52">
                  <img
                    src="https://inf-monkeys.oss-cn-beijing.aliyuncs.com/monkeys-assets/bsd/homecard1.png"
                    alt="灵感生成"
                    className="absolute object-cover transition-all duration-300"
                    style={{
                      top: '94px',
                      left: '78px',
                      width: '195px',
                      height: '272px',
                      zIndex: 1,
                    }}
                  />
                </div>
                               <div
                  className="absolute"
                  style={{
                    left: '20px',
                    top: '266px',
                    width: '127px',
                    height: '57px',
                    opacity: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    padding: 0,
                    zIndex: 2,
                  }}
                >
                  <h3 
                    className="text-xl font-semibold text-left transition-all duration-300 group-hover:text-2xl"
                    style={{
                      background: 'linear-gradient(270deg, #9AB3FF 0%, rgba(180, 169, 245, 0) 100%), #FFFFFF',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text'
                    }}
                  >
                    灵感生成
                  </h3>
                  <p 
                    className="text-sm text-left transition-all duration-300 group-hover:text-base"
                    style={{
                      background: 'linear-gradient(270deg, #9AB3FF 0%, rgba(180, 169, 245, 0) 100%), #FFFFFF',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                      opacity: 0.8
                    }}
                  >
                    核心需求深度解析
                  </p>
                </div>
             </div>

                                                                                  {/* Card 2: 自由裂变 */}
               <div 
                 className="group relative flex flex-col origin-bottom overflow-hidden transition-all duration-300 hover:w-[295px] hover:h-[396px] hover:scale-105 rounded-[20px]"
                 style={{
                   position: 'static',
                   left: '0px',
                   top: '30px',
                   width: '273px',
                   height: '366px',
                   borderRadius: '20px',
                   opacity: 1,
                   background: 'linear-gradient(0deg, rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.3)), linear-gradient(168deg, rgba(23, 23, 23, 0) 35%, rgba(39, 77, 189, 0.715) 72%, #2D62FF 87%)',
                   boxSizing: 'border-box',
                   border: '1px solid rgba(18, 220, 255, 0.6)',
                   backdropFilter: 'blur(32px)',
                   zIndex: 0,
                 }}
               >
               {/* Background overlay with blend mode */}
               <div
                 className="absolute"
                 style={{
                   position: 'absolute',
                   left: '77.5px',
                   top: '92px',
                   width: '248px',
                   height: '276px',
                   mixBlendMode: 'screen',
                   opacity: 1,
                   display: 'flex',
                   flexDirection: undefined,
                   justifyContent: undefined,
                   alignItems: undefined,
                   padding: 'NaNpx',
                   background: 'url(image.png)',
                   filter: 'opacity(0.6000000238418579)',
                 }}
               />
                               <div className="relative w-full h-48 group-hover:h-52">
                  <img
                    src="https://inf-monkeys.oss-cn-beijing.aliyuncs.com/monkeys-assets/bsd/homecard2.png"
                    alt="自由裂变"
                    className="absolute object-cover transition-all duration-300"
                    style={{
                      top: '94px',
                      left: '78px',
                      width: '195px',
                      height: '272px',
                      zIndex: 1,
                    }}
                  />
                </div>
                             <div
                 className="absolute"
                 style={{
                   left: '20px',
                   top: '266px',
                   width: '127px',
                   height: '57px',
                   opacity: 1,
                   display: 'flex',
                   flexDirection: 'column',
                   padding: 0,
                   zIndex: 10,
                 }}
               >
                                   <h3 
                    className="text-xl font-semibold text-left transition-all duration-300 group-hover:text-2xl"
                    style={{
                      background: 'linear-gradient(270deg, #9AB3FF 0%, rgba(180, 169, 245, 0) 100%), #FFFFFF',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text'
                    }}
                  >
                    自由裂变
                  </h3>
                  <p 
                    className="text-sm text-left transition-all duration-300 group-hover:text-base"
                    style={{
                      background: 'linear-gradient(270deg, #9AB3FF 0%, rgba(180, 169, 245, 0) 100%), #FFFFFF',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                      opacity: 0.8
                    }}
                  >
                    核心需求深度解析
                  </p>
               </div>
            </div>

                                                                                                       {/* Card 3: 风格融合 */}
               <div 
                 className="group relative flex flex-col origin-bottom overflow-hidden transition-all duration-300 hover:w-[295px] hover:h-[396px] hover:scale-105 rounded-[20px]"
                 style={{
                   position: 'static',
                   left: '0px',
                   top: '30px',
                   width: '273px',
                   height: '366px',
                   borderRadius: '20px',
                   opacity: 1,
                   background: 'linear-gradient(0deg, rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.3)), linear-gradient(168deg, rgba(23, 23, 23, 0) 35%, rgba(39, 77, 189, 0.715) 72%, #2D62FF 87%)',
                   boxSizing: 'border-box',
                   border: '1px solid rgba(18, 220, 255, 0.6)',
                   backdropFilter: 'blur(32px)',
                   zIndex: 0,
                 }}
               >
               {/* Background overlay with blend mode */}
               <div
                 className="absolute"
                 style={{
                   position: 'absolute',
                   left: '77.5px',
                   top: '92px',
                   width: '248px',
                   height: '276px',
                   mixBlendMode: 'screen',
                   opacity: 1,
                   display: 'flex',
                   flexDirection: undefined,
                   justifyContent: undefined,
                   alignItems: undefined,
                   padding: 'NaNpx',
                   background: 'url(image.png)',
                   filter: 'opacity(0.6000000238418579)',
                 }}
               />
                               <div className="relative w-full h-48 group-hover:h-52">
                  <img
                    src="https://inf-monkeys.oss-cn-beijing.aliyuncs.com/monkeys-assets/bsd/homecard3.png"
                    alt="风格融合"
                    className="absolute object-top transition-all duration-300"
                    style={{
                      top: '94px',
                      left: '78px',
                      width: '195px',
                      height: '272px',
                      zIndex: 1,
                    }}
                  />
                </div>
                             <div
                 className="absolute"
                 style={{
                   left: '20px',
                   top: '266px',
                   width: '127px',
                   height: '57px',
                   opacity: 1,
                   display: 'flex',
                   flexDirection: 'column',
                   padding: 0,
                   zIndex: 10,
                 }}
               >
                                   <h3 
                    className="text-xl font-semibold text-left transition-all duration-300 group-hover:text-2xl"
                    style={{
                      background: 'linear-gradient(270deg, #9AB3FF 0%, rgba(180, 169, 245, 0) 100%), #FFFFFF',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text'
                    }}
                  >
                    风格融合
                  </h3>
                  <p 
                    className="text-sm text-left transition-all duration-300 group-hover:text-base"
                    style={{
                      background: 'linear-gradient(270deg, #9AB3FF 0%, rgba(180, 169, 245, 0) 100%), #FFFFFF',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                      opacity: 0.8
                    }}
                  >
                    核心需求深度解析
                  </p>
               </div>
            </div>

                                                                                                       {/* Card 4: 局部修改 */}
               <div 
                 className="group relative flex flex-col origin-bottom overflow-hidden transition-all duration-300 hover:w-[295px] hover:h-[396px] hover:scale-105 rounded-[20px]"
                 style={{
                   position: 'static',
                   left: '0px',
                   top: '30px',
                   width: '273px',
                   height: '366px',
                   borderRadius: '20px',
                   opacity: 1,
                   background: 'linear-gradient(0deg, rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.3)), linear-gradient(168deg, rgba(23, 23, 23, 0) 35%, rgba(39, 77, 189, 0.715) 72%, #2D62FF 87%)',
                   boxSizing: 'border-box',
                   border: '1px solid rgba(18, 220, 255, 0.6)',
                   backdropFilter: 'blur(32px)',
                   zIndex: 0,
                 }}
               >
               {/* Background overlay with blend mode */}
               <div
                 className="absolute"
                 style={{
                   position: 'absolute',
                   left: '77.5px',
                   top: '92px',
                   width: '248px',
                   height: '276px',
                   mixBlendMode: 'screen',
                   opacity: 1,
                   display: 'flex',
                   flexDirection: undefined,
                   justifyContent: undefined,
                   alignItems: undefined,
                   padding: 'NaNpx',
                   background: 'url(image.png)',
                   filter: 'opacity(0.6000000238418579)',
                 }}
               />
                               <div className="relative w-full h-48 group-hover:h-52">
                  <img
                    src="https://inf-monkeys.oss-cn-beijing.aliyuncs.com/monkeys-assets/bsd/homecard4.png"
                    alt="局部修改"
                    className="absolute object-top transition-all duration-300"
                    style={{
                      top: '94px',
                      left: '78px',
                      width: '195px',
                      height: '272px',
                      zIndex: 1,
                    }}
                  />
                </div>
                             <div
                 className="absolute"
                 style={{
                   left: '20px',
                   top: '266px',
                   width: '127px',
                   height: '57px',
                   opacity: 1,
                   display: 'flex',
                   flexDirection: 'column',
                   padding: 0,
                   zIndex: 10,
                 }}
               >
                                   <h3 
                    className="text-xl font-semibold text-left transition-all duration-300 group-hover:text-2xl"
                    style={{
                      background: 'linear-gradient(270deg, #9AB3FF 0%, rgba(180, 169, 245, 0) 100%), #FFFFFF',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text'
                    }}
                  >
                    局部修改
                  </h3>
                  <p 
                    className="text-sm text-left transition-all duration-300 group-hover:text-base"
                    style={{
                      background: 'linear-gradient(270deg, #9AB3FF 0%, rgba(180, 169, 245, 0) 100%), #FFFFFF',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                      opacity: 0.8
                    }}
                  >
                    核心需求深度解析
                  </p>
               </div>
            </div>

                                                                                                       {/* Card 5: 线稿成衣 */}

               <div 
                 className="group relative flex flex-col origin-bottom overflow-hidden transition-all duration-300 hover:w-[295px] hover:h-[396px] hover:scale-105 rounded-[20px]"
                 style={{
                   position: 'static',
                   left: '0px',
                   top: '30px',
                   width: '273px',
                   height: '366px',
                   borderRadius: '20px',
                   opacity: 1,
                   background: 'linear-gradient(0deg, rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.3)), linear-gradient(168deg, rgba(23, 23, 23, 0) 35%, rgba(39, 77, 189, 0.715) 72%, #2D62FF 87%)',
                   boxSizing: 'border-box',
                   border: '1px solid rgba(18, 220, 255, 0.6)',
                   backdropFilter: 'blur(32px)',
                   zIndex: 0,
                 }}
               >
               {/* Background overlay with blend mode */}
               <div
                 className="absolute"
                 style={{
                   position: 'absolute',
                   left: '77.5px',
                   top: '92px',
                   width: '248px',
                   height: '276px',
                   mixBlendMode: 'screen',
                   opacity: 1,
                   display: 'flex',
                   flexDirection: undefined,
                   justifyContent: undefined,
                   alignItems: undefined,
                   padding: 'NaNpx',
                   background: 'url(image.png)',
                   filter: 'opacity(0.6000000238418579)',
                 }}
               />
                               {/* Image */}
                <div className="relative w-full h-48 group-hover:h-52">
                                     <img
                     src="https://inf-monkeys.oss-cn-beijing.aliyuncs.com/monkeys-assets/bsd/homecard5.png"
                     alt="线稿成衣"
                     className="absolute object-top transition-all duration-300"
                     style={{
                       top: '94px',
                       left: '78px',
                       width: '195px',
                       height: '272px',
                       zIndex: 1,
                     }}
                   />
                </div>
              {/* Text bottom-left overlay */}
                             <div
                 className="absolute"
                 style={{
                   left: '20px',
                   top: '266px',
                   width: '127px',
                   height: '57px',
                   opacity: 1,
                   display: 'flex',
                   flexDirection: 'column',
                   padding: 0,
                   zIndex: 10,
                 }}
               >
                                   <h3 
                    className="text-xl font-semibold text-left transition-all duration-300 group-hover:text-2xl"
                    style={{
                      background: 'linear-gradient(270deg, #9AB3FF 0%, rgba(180, 169, 245, 0) 100%), #FFFFFF',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text'
                    }}
                  >
                    线稿成衣
                  </h3>
                  <p 
                    className="text-sm text-left transition-all duration-300 group-hover:text-base"
                    style={{
                      background: 'linear-gradient(270deg, #9AB3FF 0%, rgba(180, 169, 245, 0) 100%), #FFFFFF',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                      opacity: 0.8
                    }}
                  >
                    访问你的灵感设计
                  </p>
               </div>
            </div>

                                                                                                       {/* Card 6: 更多AI工具 */}
               <div 
                 className="group relative flex flex-col origin-bottom overflow-hidden transition-all duration-300 hover:w-[295px] hover:h-[396px] hover:scale-105 rounded-[20px]"
                 style={{
                   position: 'static',
                   left: '0px',
                   top: '30px',
                   width: '273px',
                   height: '366px',
                   borderRadius: '20px',
                   opacity: 1,
                   background: 'linear-gradient(0deg, rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.3)), linear-gradient(168deg, rgba(23, 23, 23, 0) 35%, rgba(39, 77, 189, 0.715) 72%, #2D62FF 87%)',
                   boxSizing: 'border-box',
                   border: '1px solid rgba(18, 220, 255, 0.6)',
                   backdropFilter: 'blur(32px)',
                   zIndex: 0,
                 }}
               >
               {/* Background overlay with blend mode */}
               <div
                 className="absolute"
                 style={{
                   position: 'absolute',
                   left: '77.5px',
                   top: '92px',
                   width: '248px',
                   height: '276px',
                   mixBlendMode: 'screen',
                   opacity: 1,
                   display: 'flex',
                   flexDirection: undefined,
                   justifyContent: undefined,
                   alignItems: undefined,
                   padding: 'NaNpx',
                   background: 'url(image.png)',
                   filter: 'opacity(0.6000000238418579)',
                 }}
               />
                               <div className="relative w-full h-48 group-hover:h-52">
                  <img
                    src="https://inf-monkeys.oss-cn-beijing.aliyuncs.com/monkeys-assets/bsd/homecard6.png"
                    alt="更多AI工具"
                    className="absolute object-top transition-all duration-300"
                    style={{
                      top: '94px',
                      left: '78px',
                      width: '195px',
                      height: '272px',
                      zIndex: 1,
                    }}
                  />
                </div>
                             <div
                 className="absolute"
                 style={{
                   left: '20px',
                   top: '266px',
                   width: '127px',
                   height: '57px',
                   opacity: 1,
                   display: 'flex',
                   flexDirection: 'column',
                   padding: 0,
                   zIndex: 10,
                 }}
               >
                                   <h3 
                    className="text-xl font-semibold text-left transition-all duration-300 group-hover:text-2xl"
                    style={{
                      background: 'linear-gradient(270deg, #9AB3FF 0%, rgba(180, 169, 245, 0) 100%), #FFFFFF',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text'
                    }}
                  >
                    更多AI工具
                  </h3>
                  <p 
                    className="text-sm text-left transition-all duration-300 group-hover:text-base"
                    style={{
                      background: 'linear-gradient(270deg, #9AB3FF 0%, rgba(180, 169, 245, 0) 100%), #FFFFFF',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                      opacity: 0.8
                    }}
                  >
                    访问你的灵感设计
                  </p>
               </div>
            </div>
          </motion.div>
        </div>


      </div>
    </div>
  );
};