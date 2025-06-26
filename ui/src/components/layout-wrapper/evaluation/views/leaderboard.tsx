import React, { useMemo } from 'react';

import useSWR from 'swr';
import { useParams } from '@tanstack/react-router';

import { Award, BarChart2, TrendingUp, Users } from 'lucide-react';
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { getChartData, getEloLeaderboard, getEloStats } from '@/apis/evaluation';
import { EloLeaderboardEntry } from '@/apis/evaluation/typings.ts';
import { getMediaAsset } from '@/apis/media-data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const CHART_COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

interface ILeaderboardRowProps {
  entry: EloLeaderboardEntry;
  assetId?: string;
  assetRating?: number;
}

const LeaderboardRow: React.FC<ILeaderboardRowProps> = ({ entry, assetId, assetRating }) => {
  const {
    data: mediaAsset,
    isLoading: isMediaAssetLoading,
    error: mediaAssetError,
  } = useSWR(assetId ? ['media-asset', assetId] : null, () => getMediaAsset(assetId!));

  const wins = parseInt(entry.wins, 10) || 0;
  const losses = parseInt(entry.losses, 10) || 0;
  const draws = parseInt(entry.draws, 10) || 0;
  const totalBattles = wins + losses + draws;
  const winRate = totalBattles > 0 ? (wins / totalBattles) * 100 : 0;

  return (
    <TableRow key={entry.rank}>
      <TableCell>{entry.rank}</TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          {isMediaAssetLoading ? (
            <Skeleton className="h-10 w-10 rounded" />
          ) : mediaAssetError ? (
            <div className="flex h-10 w-10 items-center justify-center rounded bg-gray-200 text-xs text-gray-500">
              Error
            </div>
          ) : mediaAsset?.url ? (
            <img
              src={mediaAsset.url}
              alt={assetId}
              className="h-10 w-10 rounded object-cover"
              onError={(e) => {
                console.error('Image load error:', e);
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded bg-gray-200 text-xs text-gray-500">
              No Image
            </div>
          )}
          <span>{assetId ? assetId.substring(0, 8) + '...' : 'N/A'}</span>
        </div>
      </TableCell>
      <TableCell>
        {wins}/{losses}/{draws}
      </TableCell>
      <TableCell>{totalBattles}</TableCell>
      <TableCell>{winRate.toFixed(1)}%</TableCell>
      <TableCell>{typeof assetRating === 'number' ? assetRating.toFixed(0) : 'N/A'}</TableCell>
    </TableRow>
  );
};

export const LeaderboardView: React.FC = () => {
  const { moduleId } = useParams({ from: '/$teamId/evaluations/$moduleId/$tab/' });

  const { data: statsData, isLoading: isStatsLoading } = useSWR(moduleId ? ['elo-stats', moduleId] : null, () =>
    getEloStats(moduleId!),
  );
  const { data: leaderboardData, isLoading: isLeaderboardLoading } = useSWR(
    moduleId ? ['elo-leaderboard', moduleId] : null,
    () => getEloLeaderboard(moduleId!, { limit: 100 }),
  );
  const { data: rawChartData, isLoading: isChartLoading } = useSWR(moduleId ? ['elo-chart-data', moduleId] : null, () =>
    getChartData(moduleId!, { dataType: 'elo_over_time' }),
  );

  const formattedChartData = useMemo(() => {
    if (!rawChartData?.data?.trends?.trends || !statsData?.recentChanges) {
      return { data: [], lines: [] };
    }

    const trends = rawChartData.data.trends.trends;
    const recentChanges = statsData.recentChanges;

    const lines = trends.map((trend, index) => ({
      assetId: trend.assetId,
      name: trend.assetName,
      color: CHART_COLORS[index % CHART_COLORS.length],
    }));

    // Create a map of battleId to old ratings for quick lookup
    const battleOldRatings = recentChanges.reduce((acc, battle) => {
      acc[battle.battleId] = {
        [battle.assetA.id]: battle.assetA.oldRating,
        [battle.assetB.id]: battle.assetB.oldRating,
      };
      return acc;
    }, {});

    // Create individual data series for each asset
    const assetDataSeries: { [key: string]: { matchNumber: number; [key: string]: number }[] } = {};

    trends.forEach((trend) => {
      const assetId = trend.assetId;
      const points = trend.points.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      // Initialize with starting rating
      let startingRating = 1500;
      if (points.length > 0) {
        const firstPointBattleId = points[0].battleId;
        if (battleOldRatings[firstPointBattleId] && battleOldRatings[firstPointBattleId][assetId]) {
          startingRating = battleOldRatings[firstPointBattleId][assetId];
        }
      }

      // Create data points for this asset only
      const assetData = [{ matchNumber: 0, [assetId]: startingRating }];

      points.forEach((point, index) => {
        assetData.push({
          matchNumber: index + 1,
          [assetId]: point.rating,
        });
      });

      assetDataSeries[assetId] = assetData;
    });

    // Find the maximum number of matches to create the unified dataset
    const maxMatches = Math.max(0, ...Object.values(assetDataSeries).map((series) => series.length));

    // Create unified chart data
    const chartData: { matchNumber: number; [key: string]: number | undefined }[] = [];
    for (let i = 0; i < maxMatches; i++) {
      const dataPoint: { matchNumber: number; [key: string]: number | undefined } = { matchNumber: i };

      // Add data for each asset if it exists at this match number
      Object.entries(assetDataSeries).forEach(([assetId, series]) => {
        if (i < series.length) {
          dataPoint[assetId] = series[i][assetId];
        }
        // Don't add the asset data if it doesn't have a match at this point
      });

      chartData.push(dataPoint);
    }

    return { data: chartData, lines };
  }, [rawChartData, statsData]);

  // 从 chart-data 中创建 assetId 到评分的映射
  const assetRatingMap = useMemo(() => {
    if (!rawChartData?.data?.trends?.trends) {
      return new Map<string, number>();
    }

    const trends = rawChartData.data.trends.trends;
    const ratingMap = new Map<string, number>();

    trends.forEach((trend) => {
      if (trend.assetId && typeof trend.currentRating === 'number') {
        ratingMap.set(trend.assetId, trend.currentRating);
      }
    });

    return ratingMap;
  }, [rawChartData]);

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
              ELO 排行榜
            </h1>
            <p className="text-muted-foreground">基于对战结果的 ELO 评分和排名</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">参与者总数</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isStatsLoading ? <Skeleton className="h-8 w-1/2" /> : statsData?.totalParticipants ?? 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">总对战场次</CardTitle>
              <BarChart2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLeaderboardLoading ? <Skeleton className="h-8 w-1/2" /> : leaderboardData?.module?.totalBattles ?? 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">平均 ELO 分</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isChartLoading ? (
                  <Skeleton className="h-8 w-1/2" />
                ) : (
                  rawChartData?.data.trends.summary.averageRating?.toFixed(0) ?? 'N/A'
                )}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">最高 ELO 分</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isChartLoading ? (
                  <Skeleton className="h-8 w-1/2" />
                ) : (
                  rawChartData?.data.trends.summary.highestRating?.toFixed(0) ?? 'N/A'
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <Card>
          <CardHeader>
            <CardTitle>ELO 分数趋势</CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ width: '100%', height: 300 }}>
              {isChartLoading ? (
                <div className="flex h-full items-center justify-center">
                  <Skeleton className="h-full w-full" />
                </div>
              ) : (
                <ResponsiveContainer>
                  <LineChart data={formattedChartData.data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="matchNumber"
                      allowDecimals={false}
                      label={{ value: '对战场次', position: 'insideBottom', offset: -5 }}
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis label={{ value: 'ELO 评分', angle: -90, position: 'insideLeft' }} tick={{ fontSize: 12 }} />
                    <Tooltip
                      labelFormatter={(value) => `第 ${value} 场对战`}
                      formatter={(value, name) => {
                        // 只显示有数据的asset
                        if (value === undefined || value === null) {
                          return [null, null];
                        }
                        return [`${Number(value).toFixed(0)}`, name];
                      }}
                    />
                    <Legend />
                    {formattedChartData.lines.map((line) => (
                      <Line
                        key={line.assetId}
                        type="monotone"
                        dataKey={line.assetId}
                        name={line.name}
                        stroke={line.color}
                        connectNulls={false}
                        dot={{ r: 3 }}
                        activeDot={{ r: 5 }}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Leaderboard Table */}
        <Card>
          <CardHeader>
            <CardTitle>详细排名</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>排名</TableHead>
                  <TableHead>参与者</TableHead>
                  <TableHead>胜/负/平</TableHead>
                  <TableHead>总场次</TableHead>
                  <TableHead>胜率</TableHead>
                  <TableHead>评分</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLeaderboardLoading
                  ? renderSkeletons(5, 6)
                  : (leaderboardData?.items || [])
                      .map((item, index) => {
                        // 为每个item分配一个真实的assetId（按chart-data中的评分排序）
                        const sortedAssets = Array.from(assetRatingMap.entries())
                          .map(([assetId, rating]) => ({ assetId, rating }))
                          .sort((a, b) => b.rating - a.rating);

                        const assetData = sortedAssets[index];

                        return {
                          ...item,
                          rank: index + 1, // 重新分配排名
                          assetId: assetData?.assetId,
                          currentRating: assetData?.rating,
                        };
                      })
                      .map((item) => {
                        const entry: EloLeaderboardEntry = {
                          rank: item.rank,
                          asset: {
                            id: item.assetId || '',
                            name: item.assetId ? item.assetId.substring(0, 8) + '...' : 'Unknown',
                            type: 'media',
                          },
                          totalBattles: item.totalBattles,
                          wins: item.wins,
                          losses: item.losses,
                          draws: item.draws,
                          winRate: item.winRate,
                        };

                        return (
                          <LeaderboardRow
                            key={item.rank}
                            entry={entry}
                            assetId={item.assetId}
                            assetRating={item.currentRating}
                          />
                        );
                      })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
