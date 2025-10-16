import React, { useCallback, useEffect, useState } from 'react';

import { useMatches } from '@tanstack/react-router';

import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, CheckCircle, Loader2, XCircle } from 'lucide-react';

import { useTeamStatusSSE } from '@/apis/authz/team/team-status';
import { ITeamInitStatusEnum } from '@/apis/authz/team/typings';
import { VinesLoading } from '@/components/ui/loading';

import { useVinesTeam } from './team';

interface TeamStatusGuardProps {
  children: React.ReactNode;
  /** 是否启用团队状态守卫 */
  enabled?: boolean;
  /** 遮罩层背景透明度 */
  backdropOpacity?: number;
  /** 是否显示模糊效果 */
  enableBlur?: boolean;
  /** 成功状态显示时长（毫秒） */
  successDisplayDuration?: number;
  /** 失败状态显示时长（毫秒） */
  errorDisplayDuration?: number;
}

export const TeamStatusGuard: React.FC<TeamStatusGuardProps> = ({
  children,
  enabled = true,
  backdropOpacity = 0.5,
  enableBlur = true,
  successDisplayDuration = 1500,
  errorDisplayDuration = 2000,
}) => {
  const matches = useMatches();
  const { teamId } = useVinesTeam();

  const [showOverlay, setShowOverlay] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [statusDescription, setStatusDescription] = useState('');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<ITeamInitStatusEnum | null>(null);

  // 检查当前路由是否包含 teamId
  const isTeamRoute = matches.some((match) => match.routeId.startsWith('/$teamId/'));

  // 状态变化处理函数
  const handleStatusChange = useCallback(
    (newStatus: ITeamInitStatusEnum | undefined) => {
      if (!newStatus) return;

      setCurrentStatus(newStatus);

      switch (newStatus) {
        case ITeamInitStatusEnum.PENDING:
          setStatusMessage('数据更新中');
          setStatusDescription('正在同步数据，请稍候...');
          setShowOverlay(true);
          setIsTransitioning(false);
          break;

        case ITeamInitStatusEnum.SUCCESS:
          setStatusMessage('更新完毕');
          setStatusDescription('数据已更新完成');
          setIsTransitioning(true);
          // 延迟隐藏遮罩，让用户看到"更新完毕"的消息
          setTimeout(() => {
            setShowOverlay(false);
            setIsTransitioning(false);
          }, successDisplayDuration);
          break;

        case ITeamInitStatusEnum.FAILED:
          setStatusMessage('更新失败');
          setStatusDescription('数据更新失败，请稍后重试');
          setIsTransitioning(true);
          setTimeout(() => {
            setShowOverlay(false);
            setIsTransitioning(false);
          }, errorDisplayDuration);
          break;
      }
    },
    [successDisplayDuration, errorDisplayDuration],
  );

  // 错误处理函数
  const handleError = useCallback(
    (err: Error) => {
      console.error('团队状态监听错误:', err);
      setStatusMessage('连接失败');
      setStatusDescription('无法连接到服务器，请检查网络连接');
      setCurrentStatus(ITeamInitStatusEnum.FAILED);
      setIsTransitioning(true);
      setTimeout(() => {
        setShowOverlay(false);
        setIsTransitioning(false);
      }, errorDisplayDuration);
    },
    [errorDisplayDuration],
  );

  // 使用团队状态 SSE hook
  const { status, isLoading, error } = useTeamStatusSSE(teamId || '', {
    enabled: enabled && !!teamId && isTeamRoute,
    onStatusChange: handleStatusChange,
    onError: handleError,
  });

  // 当路由变化时重置状态
  useEffect(() => {
    if (!isTeamRoute) {
      setShowOverlay(false);
      setIsTransitioning(false);
      setCurrentStatus(null);
    }
  }, [isTeamRoute]);

  // 渲染状态图标
  const renderStatusIcon = () => {
    if (currentStatus === ITeamInitStatusEnum.PENDING) {
      return <VinesLoading />;
    } else if (currentStatus === ITeamInitStatusEnum.SUCCESS) {
      return <CheckCircle className="h-12 w-12 text-green-500" />;
    } else if (currentStatus === ITeamInitStatusEnum.FAILED) {
      return <XCircle className="h-12 w-12 text-red-500" />;
    } else if (error) {
      return <AlertCircle className="h-12 w-12 text-orange-500" />;
    }
    return <Loader2 className="h-12 w-12 animate-spin text-gray-500" />;
  };

  // 获取状态颜色
  const getStatusColor = () => {
    if (currentStatus === ITeamInitStatusEnum.SUCCESS) return 'text-green-600 dark:text-green-400';
    if (currentStatus === ITeamInitStatusEnum.FAILED) return 'text-red-600 dark:text-red-400';
    if (error) return 'text-orange-600 dark:text-orange-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  if (!enabled) {
    return <>{children}</>;
  }

  return (
    <>
      {children}
      <AnimatePresence>
        {showOverlay && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center"
            style={{
              backgroundColor: `rgba(0, 0, 0, ${backdropOpacity})`,
              backdropFilter: enableBlur ? 'blur(4px)' : 'none',
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ duration: 0.2 }}
              className="mx-4 max-w-md rounded-xl border border-gray-200 bg-white p-8 shadow-2xl dark:border-gray-700 dark:bg-gray-800"
            >
              <div className="flex flex-col items-center space-y-4">
                {renderStatusIcon()}

                <div className="text-center">
                  <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-100">{statusMessage}</h3>

                  <p className={`text-sm ${getStatusColor()}`}>{statusDescription}</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
