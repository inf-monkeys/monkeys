import React, { useEffect } from 'react';

import { createFileRoute, useSearch } from '@tanstack/react-router';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useEvaluationStore } from '@/store/useEvaluationStore';

interface EvaluationDetailSearch {
  moduleId?: string;
}

export const EvaluationDetail: React.FC = () => {
  const search = useSearch({ from: '/$teamId/evaluations/detail' }) as EvaluationDetailSearch;
  const { moduleId } = search;

  const { currentModule, fetchModuleDetails, leaderboard, fetchLeaderboard, loading, isEvaluating } =
    useEvaluationStore();

  useEffect(() => {
    if (moduleId) {
      void fetchModuleDetails(moduleId);
      void fetchLeaderboard(moduleId);
    }
  }, [moduleId, fetchModuleDetails, fetchLeaderboard]);

  if (!moduleId) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold">缺少模块ID</h2>
          <p className="text-muted-foreground">请从评测模块列表中选择一个模块查看详情</p>
        </div>
      </div>
    );
  }

  if (loading && !currentModule) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!currentModule) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold">模块未找到</h2>
          <p className="text-muted-foreground">指定的评测模块不存在或已被删除</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* 模块基本信息 */}
      <Card>
        <CardHeader>
          <CardTitle>{currentModule.displayName}</CardTitle>
          <CardDescription>{currentModule.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div>
              <span className="font-medium">评测标准：</span>
              <span className="text-muted-foreground">{currentModule.evaluationCriteria || '未设置'}</span>
            </div>
            <div>
              <span className="font-medium">创建时间：</span>
              <span className="text-muted-foreground">{new Date(currentModule.createdAt).toLocaleString()}</span>
            </div>
            <div>
              <span className="font-medium">更新时间：</span>
              <span className="text-muted-foreground">{new Date(currentModule.updatedAt).toLocaleString()}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 操作区域 */}
      <Card>
        <CardHeader>
          <CardTitle>评测操作</CardTitle>
          <CardDescription>配置并启动自动评测任务</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button
              onClick={() => {
                // TODO: 实现选择参与者和启动评测的逻辑
                console.log('Start auto evaluation for module:', moduleId);
              }}
              loading={isEvaluating}
              disabled={isEvaluating}
            >
              {isEvaluating ? '评测中...' : '启动自动评测'}
            </Button>
            <Button variant="outline">配置评测员</Button>
            <Button variant="outline">添加参与者</Button>
          </div>
        </CardContent>
      </Card>

      {/* ELO排行榜 */}
      <Card>
        <CardHeader>
          <CardTitle>ELO排行榜</CardTitle>
          <CardDescription>基于对战结果的评分排名</CardDescription>
        </CardHeader>
        <CardContent>
          {leaderboard.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">暂无排行榜数据，请先启动评测任务</div>
          ) : (
            <div className="space-y-2">
              {leaderboard.slice(0, 10).map((entry) => (
                <div key={entry.rank} className="flex items-center justify-between rounded-lg border p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary font-bold text-primary-foreground">
                      {entry.rank}
                    </div>
                    <div>
                      <div className="font-medium">{entry.asset.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {entry.wins}胜 {entry.losses}负 {entry.draws}平
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    {typeof entry.rating === 'number' && (
                      <div className="text-lg font-bold">{Math.round(entry.rating)}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export const Route = createFileRoute('/$teamId/evaluations/detail')({
  component: EvaluationDetail,
  validateSearch: (search: Record<string, unknown>): EvaluationDetailSearch => {
    return {
      moduleId: search.moduleId as string,
    };
  },
});
