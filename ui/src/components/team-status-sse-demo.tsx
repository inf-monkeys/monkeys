import React, { useState } from 'react';

import { AlertCircle, CheckCircle, Clock, Wifi, WifiOff } from 'lucide-react';

import { useTeamStatusSSE } from '@/apis/authz/team/team-status';
import { ITeamInitStatusEnum } from '@/apis/authz/team/typings.ts';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface TeamStatusSSEDemoProps {
  teamId: string;
}

/**
 * 团队状态 SSE 演示组件
 */
export const TeamStatusSSEDemo: React.FC<TeamStatusSSEDemoProps> = ({ teamId }) => {
  const [statusHistory, setStatusHistory] = useState<
    Array<{ status: ITeamInitStatusEnum | undefined; timestamp: Date }>
  >([]);

  const { status, isConnected, isLoading, error, reconnect, disconnect } = useTeamStatusSSE(teamId, {
    enabled: true,
    onStatusChange: (newStatus) => {
      setStatusHistory((prev) => [...prev, { status: newStatus, timestamp: new Date() }]);
    },
    onConnect: () => {
      console.log('SSE 连接已建立');
    },
    onDisconnect: () => {
      console.log('SSE 连接已断开');
    },
    onError: (err) => {
      console.error('团队状态获取错误:', err);
    },
  });

  const getStatusIcon = (status: ITeamInitStatusEnum | undefined) => {
    switch (status) {
      case ITeamInitStatusEnum.SUCCESS:
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case ITeamInitStatusEnum.FAILED:
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case ITeamInitStatusEnum.PENDING:
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusText = (status: ITeamInitStatusEnum | undefined) => {
    switch (status) {
      case ITeamInitStatusEnum.SUCCESS:
        return '初始化成功';
      case ITeamInitStatusEnum.FAILED:
        return '初始化失败';
      case ITeamInitStatusEnum.PENDING:
        return '初始化中';
      default:
        return '未知状态';
    }
  };

  const getStatusColor = (status: ITeamInitStatusEnum | undefined) => {
    switch (status) {
      case ITeamInitStatusEnum.SUCCESS:
        return 'bg-green-100 text-green-800';
      case ITeamInitStatusEnum.FAILED:
        return 'bg-red-100 text-red-800';
      case ITeamInitStatusEnum.PENDING:
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            团队状态 SSE 演示
            {isConnected ? <Wifi className="h-5 w-5 text-green-500" /> : <WifiOff className="h-5 w-5 text-red-500" />}
          </CardTitle>
          <CardDescription>团队 ID: {teamId}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 当前状态 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">当前状态:</span>
              <div className="flex items-center gap-2">
                {getStatusIcon(status)}
                <Badge className={getStatusColor(status)}>{getStatusText(status)}</Badge>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">连接状态: {isConnected ? '已连接' : '未连接'}</span>
              {isLoading && <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-blue-500"></div>}
            </div>
          </div>

          {/* 错误信息 */}
          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <span className="text-sm text-red-700">错误: {error.message}</span>
              </div>
            </div>
          )}

          {/* 控制按钮 */}
          <div className="flex gap-2">
            <Button onClick={reconnect} disabled={isLoading} variant="outline" size="sm">
              重连
            </Button>
            <Button onClick={disconnect} disabled={!isConnected} variant="outline" size="sm">
              断开连接
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 状态历史 */}
      {statusHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>状态变化历史</CardTitle>
            <CardDescription>显示最近的状态变化记录</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-h-60 space-y-2 overflow-y-auto">
              {statusHistory
                .slice(-10)
                .reverse()
                .map((item, index) => (
                  <div key={index} className="flex items-center justify-between rounded bg-gray-50 p-2">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(item.status)}
                      <span className="text-sm">{getStatusText(item.status)}</span>
                    </div>
                    <span className="text-xs text-gray-500">{item.timestamp.toLocaleTimeString()}</span>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
