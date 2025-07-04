import React, { useEffect, useRef, useState } from 'react';

import useSWR, { mutate } from 'swr';
import { useParams } from '@tanstack/react-router';

import { Award, BarChart2, CheckCircle2, Download, FileSpreadsheet, FileText, TrendingUp, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import {
  ExportHtmlOptions,
  exportLeaderboardCsv,
  exportLeaderboardHtml,
  getEloLeaderboard,
  getEvaluationStatus,
  getOpenSkillLeaderboard,
} from '@/apis/evaluation';
import { getMediaAsset } from '@/apis/media-data';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip } from '@/components/ui/tooltip';

import { RatingTrendChart } from './RatingTrendChart';

interface IOpenSkillLeaderboardRowProps {
  item: any; // OpenSkillLeaderboardItem
}

const OpenSkillLeaderboardRow: React.FC<IOpenSkillLeaderboardRowProps> = ({ item }) => {
  const { t } = useTranslation();
  const {
    data: mediaAsset,
    isLoading: isMediaAssetLoading,
    error: mediaAssetError,
  } = useSWR(item.assetId ? ['media-asset', item.assetId] : null, () => getMediaAsset(item.assetId!));

  const getSigmaColor = (sigma: number) => {
    if (sigma < 5.0) return 'text-green-600';
    if (sigma < 7.0) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <TableRow key={item.assetId}>
      <TableCell>{item.rank}</TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          {isMediaAssetLoading ? (
            <Skeleton className="h-10 w-10 rounded" />
          ) : mediaAssetError ? (
            <div className="flex h-10 w-10 items-center justify-center rounded bg-gray-200 text-xs text-gray-500">
              {t('ugc-page.evaluation.leaderboard.detailedRanking.error')}
            </div>
          ) : mediaAsset?.url ? (
            <img
              src={mediaAsset.url}
              alt={item.assetId}
              className="h-10 w-10 rounded object-cover"
              onError={(e) => {
                console.error('Image load error:', e);
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded bg-gray-200 text-xs text-gray-500">
              {t('ugc-page.evaluation.leaderboard.detailedRanking.noImage')}
            </div>
          )}
          <span>{mediaAsset?.displayName || item.assetId?.substring(0, 8) + '...' || 'N/A'}</span>
        </div>
      </TableCell>
      <TableCell>
        <span className="font-mono font-medium">{item.rating?.toFixed(0) ?? 'N/A'}</span>
      </TableCell>
      <TableCell>
        <span className="font-mono text-sm text-muted-foreground">{item.mu?.toFixed(1) ?? 'N/A'}</span>
      </TableCell>
      <TableCell>
        <span className={`font-mono text-sm font-medium ${getSigmaColor(item.sigma)}`}>
          {item.sigma?.toFixed(2) ?? 'N/A'}
        </span>
      </TableCell>
      <TableCell>{item.totalBattles}</TableCell>
    </TableRow>
  );
};

export const LeaderboardView: React.FC = () => {
  const { t } = useTranslation();
  const { moduleId } = useParams({ from: '/$teamId/evaluations/$moduleId/$tab/' });
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // 自动刷新定时器和状态
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [isPageVisible, setIsPageVisible] = useState(true);

  // 导出相关状态
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportType, setExportType] = useState<'html' | 'csv'>('html');
  const [exportOptions, setExportOptions] = useState<ExportHtmlOptions>({
    limit: 1000,
    minBattles: 0,
  });

  // Data for Stats Cards
  const { data: eloLeaderboardData, isLoading: isEloLeaderboardLoading } = useSWR(
    moduleId ? ['elo-leaderboard', moduleId] : null,
    () => getEloLeaderboard(moduleId!, { limit: 1 }), // Only need stats, so limit to 1
  );

  // Data for Detailed Table
  const { data: openSkillLeaderboardData, isLoading: isOpenSkillLoading } = useSWR(
    moduleId ? ['openskill-leaderboard', moduleId, page, limit] : null,
    () => getOpenSkillLeaderboard(moduleId!, { page, limit }),
  );

  const { data: evaluationStatus, isLoading: isStatusLoading } = useSWR(
    moduleId ? ['evaluation-status', moduleId] : null,
    () => getEvaluationStatus(moduleId!),
  );

  // 处理导出功能
  const handleExport = async () => {
    if (!moduleId) return;

    setIsExporting(true);
    try {
      if (exportType === 'html') {
        await exportLeaderboardHtml(moduleId, exportOptions);
        toast.success(t('ugc-page.evaluation.leaderboard.export.success.title'), {
          description: t('ugc-page.evaluation.leaderboard.export.success.html'),
        });
      } else {
        await exportLeaderboardCsv(moduleId, {
          includeImageUrls: true,
        });
        toast.success(t('ugc-page.evaluation.leaderboard.export.success.title'), {
          description: t('ugc-page.evaluation.leaderboard.export.success.csv'),
        });
      }
      setIsExportDialogOpen(false);
    } catch (error) {
      console.error('Export failed:', error);
      toast.error(t('ugc-page.evaluation.leaderboard.export.error.title'), {
        description:
          error instanceof Error ? error.message : t('ugc-page.evaluation.leaderboard.export.error.description'),
      });
    } finally {
      setIsExporting(false);
    }
  };

  // 自动刷新函数
  const refreshData = () => {
    if (!moduleId) return;

    // 刷新四个接口的数据
    mutate(['elo-leaderboard', moduleId]);
    mutate(['openskill-leaderboard', moduleId, page, limit]);
    mutate(['evaluation-status', moduleId]);
    mutate(['chart-data-trends', moduleId]);
  };

  // 设置自动刷新定时器
  const startAutoRefresh = () => {
    // 清除现有定时器
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
    }

    // 设置新的定时器
    refreshTimerRef.current = setTimeout(() => {
      refreshData();
      startAutoRefresh(); // 递归调用实现持续刷新
    }, 3000); // 3秒刷新
  };

  // 停止自动刷新
  const stopAutoRefresh = () => {
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
  };

  // 监听页面可见性，失去焦点时停止刷新
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsPageVisible(!document.hidden);
    };

    const handleFocus = () => setIsPageVisible(true);
    const handleBlur = () => setIsPageVisible(false);

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

  // 根据页面可见性控制自动刷新
  useEffect(() => {
    if (moduleId && isPageVisible) {
      startAutoRefresh();
    } else {
      stopAutoRefresh();
    }

    return () => {
      stopAutoRefresh();
    };
  }, [moduleId, isPageVisible]);

  // 页面或分页参数变化时，也需要重新开始刷新（因为key变了）
  useEffect(() => {
    if (moduleId && isPageVisible) {
      startAutoRefresh();
    }
  }, [page, limit]);

  // 页面大小改变时重置到第一页
  const handleLimitChange = (newLimit: string) => {
    setLimit(parseInt(newLimit));
    setPage(1);
  };

  const renderSkeletons = (count: number, columns: number) =>
    Array.from({ length: count }).map((_, i) => (
      <TableRow key={i}>
        {Array.from({ length: columns }).map((_, j) => (
          <TableCell key={j}>
            <Skeleton className="h-4 w-full" />
          </TableCell>
        ))}
      </TableRow>
    ));

  return (
    <div className="h-full overflow-auto rounded-xl border border-input p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold">
              <Award className="h-6 w-6" />
              {t('ugc-page.evaluation.leaderboard.title')}
              {/* 自动刷新指示器 */}
              <div className="flex items-center gap-1 text-sm font-normal text-muted-foreground">
                <div
                  className={`h-2 w-2 rounded-full ${isPageVisible ? 'animate-pulse bg-green-500' : 'bg-gray-400'}`}
                />
                <span>
                  {isPageVisible
                    ? t('ugc-page.evaluation.leaderboard.autoRefresh.active')
                    : t('ugc-page.evaluation.leaderboard.autoRefresh.paused')}
                </span>
              </div>
            </h1>
            <p className="text-muted-foreground">{t('ugc-page.evaluation.leaderboard.description')}</p>
          </div>

          {/* 导出按钮 - 评测未完成时禁用 */}
          {evaluationStatus?.isComplete ? (
            <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Download className="h-4 w-4" />
                  {t('ugc-page.evaluation.leaderboard.export.button')}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>{t('ugc-page.evaluation.leaderboard.export.title')}</DialogTitle>
                  <DialogDescription>{t('ugc-page.evaluation.leaderboard.export.description')}</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="exportType" className="text-right">
                      {t('ugc-page.evaluation.leaderboard.export.format.label')}
                    </Label>
                    <Select value={exportType} onValueChange={(value: 'html' | 'csv') => setExportType(value)}>
                      <SelectTrigger className="col-span-3">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="html">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            {t('ugc-page.evaluation.leaderboard.export.format.html')}
                          </div>
                        </SelectItem>
                        <SelectItem value="csv">
                          <div className="flex items-center gap-2">
                            <FileSpreadsheet className="h-4 w-4" />
                            {t('ugc-page.evaluation.leaderboard.export.format.csv')}
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {exportType === 'html' && (
                    <>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="minRating" className="text-right">
                          {t('ugc-page.evaluation.leaderboard.export.options.minRating')}
                        </Label>
                        <Input
                          id="minRating"
                          type="number"
                          placeholder={t('ugc-page.evaluation.leaderboard.export.options.placeholder.noLimit')}
                          className="col-span-3"
                          value={exportOptions.minRating || ''}
                          onChange={(value) =>
                            setExportOptions({
                              ...exportOptions,
                              minRating: value ? parseFloat(value) : undefined,
                            })
                          }
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="maxRating" className="text-right">
                          {t('ugc-page.evaluation.leaderboard.export.options.maxRating')}
                        </Label>
                        <Input
                          id="maxRating"
                          type="number"
                          placeholder={t('ugc-page.evaluation.leaderboard.export.options.placeholder.noLimit')}
                          className="col-span-3"
                          value={exportOptions.maxRating || ''}
                          onChange={(value) =>
                            setExportOptions({
                              ...exportOptions,
                              maxRating: value ? parseFloat(value) : undefined,
                            })
                          }
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="limit" className="text-right">
                          {t('ugc-page.evaluation.leaderboard.export.options.limit')}
                        </Label>
                        <Input
                          id="limit"
                          type="number"
                          placeholder={t('ugc-page.evaluation.leaderboard.export.options.placeholder.maxLimit')}
                          max={5000}
                          className="col-span-3"
                          value={exportOptions.limit || ''}
                          onChange={(value) =>
                            setExportOptions({
                              ...exportOptions,
                              limit: value ? parseInt(value) : undefined,
                            })
                          }
                        />
                      </div>
                    </>
                  )}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsExportDialogOpen(false)}>
                    {t('ugc-page.evaluation.leaderboard.export.actions.cancel')}
                  </Button>
                  <Button onClick={handleExport} disabled={isExporting}>
                    {isExporting
                      ? t('ugc-page.evaluation.leaderboard.export.actions.exporting')
                      : t('ugc-page.evaluation.leaderboard.export.actions.confirm')}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          ) : (
            <Tooltip content={t('ugc-page.evaluation.leaderboard.export.disabled.tooltip')}>
              <span>
                <Button variant="outline" className="gap-2" disabled>
                  <Download className="h-4 w-4" />
                  {t('ugc-page.evaluation.leaderboard.export.button')}
                </Button>
              </span>
            </Tooltip>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t('ugc-page.evaluation.leaderboard.totalParticipants')}
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isEloLeaderboardLoading ? <Skeleton className="h-8 w-1/2" /> : eloLeaderboardData?.total ?? 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('ugc-page.evaluation.leaderboard.totalBattles')}</CardTitle>
              <BarChart2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isEloLeaderboardLoading ? (
                  <Skeleton className="h-8 w-1/2" />
                ) : (
                  eloLeaderboardData?.module?.totalBattles ?? 0
                )}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('ugc-page.evaluation.leaderboard.progress')}</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isStatusLoading ? (
                  <Skeleton className="h-8 w-1/2" />
                ) : (
                  `${evaluationStatus?.progress.toFixed(1) ?? '0'}%`
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 评测状态概览 */}
        {evaluationStatus && (
          <Card
            className={`${evaluationStatus.isComplete ? 'border-green-200 bg-green-50' : 'border-blue-200 bg-blue-50'}`}
          >
            <CardHeader>
              <CardTitle
                className={`flex items-center gap-2 ${
                  evaluationStatus.isComplete ? 'text-green-700' : 'text-blue-700'
                }`}
              >
                {evaluationStatus.isComplete ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                )}
                {t('ugc-page.evaluation.leaderboard.status.title')}:{' '}
                {evaluationStatus.isComplete
                  ? t('ugc-page.evaluation.leaderboard.status.completed')
                  : t('ugc-page.evaluation.leaderboard.status.inProgress')}
              </CardTitle>
            </CardHeader>
          </Card>
        )}

        {/* Rating Trend Chart */}
        <RatingTrendChart />

        {/* Leaderboard Table */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{t('ugc-page.evaluation.leaderboard.detailedRanking.title')}</CardTitle>
            {/* 页面大小选择器 */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {t('ugc-page.evaluation.leaderboard.table.itemsPerPage')}
              </span>
              <Select value={limit.toString()} onValueChange={handleLimitChange}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('ugc-page.evaluation.leaderboard.detailedRanking.rank')}</TableHead>
                  <TableHead>{t('ugc-page.evaluation.leaderboard.detailedRanking.participant')}</TableHead>
                  <TableHead>{t('ugc-page.evaluation.leaderboard.detailedRanking.rating')}</TableHead>
                  <TableHead>{t('ugc-page.evaluation.leaderboard.detailedRanking.mu')}</TableHead>
                  <TableHead>{t('ugc-page.evaluation.leaderboard.detailedRanking.sigma')}</TableHead>
                  <TableHead>{t('ugc-page.evaluation.leaderboard.detailedRanking.battles')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isOpenSkillLoading
                  ? renderSkeletons(limit, 6)
                  : (openSkillLeaderboardData?.data || []).map((item) => (
                      <OpenSkillLeaderboardRow key={item.assetId} item={item} />
                    ))}
              </TableBody>
            </Table>

            {/* 增强的分页控制 */}
            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {t('ugc-page.evaluation.leaderboard.table.totalRecords', {
                  total: openSkillLeaderboardData?.total || 0,
                })}
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="small"
                  onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                  disabled={page === 1 || isOpenSkillLoading}
                >
                  {t('ugc-page.evaluation.leaderboard.pagination.previous')}
                </Button>
                <span className="text-sm">
                  {t('ugc-page.evaluation.leaderboard.table.pageInfo', {
                    page: openSkillLeaderboardData?.page ?? 1,
                    totalPages: Math.ceil((openSkillLeaderboardData?.total || 0) / limit),
                  })}
                </span>
                <Button
                  variant="outline"
                  size="small"
                  onClick={() => setPage((prev) => prev + 1)}
                  disabled={
                    isOpenSkillLoading ||
                    (openSkillLeaderboardData &&
                      openSkillLeaderboardData.page * limit >= openSkillLeaderboardData.total)
                  }
                >
                  {t('ugc-page.evaluation.leaderboard.pagination.next')}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
