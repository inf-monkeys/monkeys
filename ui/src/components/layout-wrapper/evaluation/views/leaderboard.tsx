import React, { useState } from 'react';

import useSWR from 'swr';
import { useParams } from '@tanstack/react-router';

import { Award, BarChart2, CheckCircle2, TrendingUp, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { getEloLeaderboard, getEvaluationStatus, getOpenSkillLeaderboard } from '@/apis/evaluation';
import { getMediaAsset } from '@/apis/media-data';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

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
          <span>{item.assetId ? item.assetId.substring(0, 8) + '...' : 'N/A'}</span>
        </div>
      </TableCell>
      <TableCell>
        <span className="font-mono font-medium">{item.exposedRating?.toFixed(0) ?? 'N/A'}</span>
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
  const limit = 10;

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
    { refreshInterval: 10000 },
  );

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
            </h1>
            <p className="text-muted-foreground">{t('ugc-page.evaluation.leaderboard.description')}</p>
          </div>
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
          <CardHeader>
            <CardTitle>{t('ugc-page.evaluation.leaderboard.detailedRanking.title')}</CardTitle>
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
            <div className="mt-4 flex items-center justify-end space-x-2">
              <Button
                variant="outline"
                size="small"
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                disabled={page === 1 || isOpenSkillLoading}
              >
                {t('ugc-page.evaluation.leaderboard.pagination.previous')}
              </Button>
              <span className="text-sm">
                {t('ugc-page.evaluation.leaderboard.pagination.page', {
                  page: openSkillLeaderboardData?.page ?? 1,
                  totalPages: Math.ceil(
                    (openSkillLeaderboardData?.total || 0) / (openSkillLeaderboardData?.limit || limit),
                  ),
                })}
              </span>
              <Button
                variant="outline"
                size="small"
                onClick={() => setPage((prev) => prev + 1)}
                disabled={
                  isOpenSkillLoading ||
                  (openSkillLeaderboardData &&
                    openSkillLeaderboardData.page * openSkillLeaderboardData.limit >= openSkillLeaderboardData.total)
                }
              >
                {t('ugc-page.evaluation.leaderboard.pagination.next')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
