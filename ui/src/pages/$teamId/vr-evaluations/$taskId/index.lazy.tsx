import React, { useMemo } from 'react';

import useSWR from 'swr';
import { createLazyFileRoute, useRouter } from '@tanstack/react-router';

import { RadarChart } from 'echarts/charts';
import { LegendComponent, TooltipComponent } from 'echarts/components';
import * as echarts from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import ReactECharts from 'echarts-for-react';
import { Undo2 } from 'lucide-react';

import { vinesFetcher } from '@/apis/fetcher';
import { VRTask } from '@/apis/ugc/vr-evaluation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton.tsx';

echarts.use([TooltipComponent, LegendComponent, RadarChart, CanvasRenderer]);

const scoreLabels = [
  '外观美观度',
  '材质/做工质量',
  '使用舒适度',
  '操作便利性',
  '功能满足需求',
  '功能使用高效',
  '结实耐用性',
  '使用安全性',
  '模型几何质量',
  '模型纹理质量',
];

const formatDateTime = (value?: number | string) => {
  if (!value) return '-';
  const date = typeof value === 'number' ? new Date(value) : new Date(value);
  if (Number.isNaN(date.valueOf())) return '-';
  return date.toLocaleString();
};

export const VREvaluationTaskDetail: React.FC = () => {
  const { history } = useRouter();
  const { taskId } = Route.useParams();

  const detailFetcher = useMemo(() => vinesFetcher<VRTask>(), []);

  const {
    data: task,
    isLoading,
    error,
  } = useSWR(taskId ? ['vr-task-detail', taskId] : null, ([, id]) => detailFetcher(`/api/vr-evaluation/tasks/${id}`));

  const chartOption = useMemo(() => {
    if (!task?.evaluationResult) {
      return null;
    }

    const values = scoreLabels.map(
      (_, index) => task.evaluationResult?.[`score_${index + 1}` as keyof typeof task.evaluationResult] ?? 0,
    );

    return {
      tooltip: { trigger: 'item' },
      radar: {
        indicator: scoreLabels.map((label) => ({ name: label, max: 5 })),
        radius: '65%',
      },
      series: [
        {
          type: 'radar',
          data: [
            {
              value: values,
              name: '综合评分',
              areaStyle: { opacity: 0.2 },
              lineStyle: { width: 2 },
            },
          ],
        },
      ],
    };
  }, [task?.evaluationResult]);

  return (
    <main className="flex size-full flex-col gap-global">
      <header className="flex items-center gap-global">
        <Button
          icon={<Undo2 />}
          variant="outline"
          size="small"
          className="scale-85 -m-1 -ml-0.5 -mr-2"
          onClick={() => history.back()}
        />
        <h1 className="line-clamp-1 text-2xl font-bold">VR 评测任务详情</h1>
      </header>

      {isLoading && (
        <div className="grid gap-global md:grid-cols-2">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full md:col-span-2" />
        </div>
      )}

      {error && (
        <Card>
          <CardHeader>
            <CardTitle>加载失败</CardTitle>
            <CardDescription>{error instanceof Error ? error.message : '未知错误'}</CardDescription>
          </CardHeader>
        </Card>
      )}

      {!isLoading && !error && task && (
        <>
          <div className="grid gap-global lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>{task.taskName}</CardTitle>
                <CardDescription>任务基础信息</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
                  {task.thumbnailUrl ? (
                    <img src={task.thumbnailUrl} alt={task.taskName} className="h-24 w-24 rounded-lg object-cover" />
                  ) : (
                    <div className="flex h-24 w-24 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 text-lg font-semibold text-white">
                      VR
                    </div>
                  )}
                  <div className="flex-1 space-y-3">
                    <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">模型链接</span>
                      <a
                        href={task.modelUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="break-all rounded bg-muted px-3 py-2 text-primary hover:underline"
                      >
                        {task.modelUrl}
                      </a>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">状态:</span>
                      <Badge variant={task.status === 'completed' ? 'default' : 'secondary'}>
                        {task.status === 'completed' ? '已完成' : '待评测'}
                      </Badge>
                    </div>
                    <div className="grid gap-1 text-sm text-muted-foreground">
                      <span>创建时间：{formatDateTime(task.createdTimestamp)}</span>
                      <span>更新时间：{formatDateTime(task.updatedTimestamp)}</span>
                      <span>完成时间：{formatDateTime(task.evaluatedAt)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>评分雷达图</CardTitle>
                <CardDescription>展示 10 项维度的评分分布</CardDescription>
              </CardHeader>
              <CardContent className="flex h-80 items-center justify-center">
                {chartOption ? (
                  <ReactECharts
                    echarts={echarts}
                    option={chartOption}
                    notMerge
                    lazyUpdate
                    style={{ height: '100%', width: '100%' }}
                  />
                ) : (
                  <span className="text-sm text-muted-foreground">尚未提交评测结果</span>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </main>
  );
};

export const Route = createLazyFileRoute('/$teamId/vr-evaluations/$taskId/')({
  component: VREvaluationTaskDetail,
});
