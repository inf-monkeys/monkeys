import React, { useMemo } from 'react';

import useSWR from 'swr';
import { useParams } from '@tanstack/react-router';

import { Award, BarChart2, TrendingUp, Users } from 'lucide-react';
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { getChartData, getEloLeaderboard, getEloStats } from '@/apis/evaluation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const CHART_COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

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

    const lastRatings = {};
    // Initialize with rating before the very first match in the trend
    trends.forEach((trend) => {
      if (trend.points.length > 0) {
        const firstPointBattleId = trend.points[0].battleId;
        if (battleOldRatings[firstPointBattleId] && battleOldRatings[firstPointBattleId][trend.assetId]) {
          lastRatings[trend.assetId] = battleOldRatings[firstPointBattleId][trend.assetId];
        } else {
          lastRatings[trend.assetId] = 1500; // Fallback
        }
      } else {
        lastRatings[trend.assetId] = 1500; // Fallback for assets with no matches
      }
    });

    const chartData = [{ matchNumber: 0, ...lastRatings }];

    const allPoints = trends
      .flatMap((trend) => trend.points.map((p) => ({ ...p, assetId: trend.assetId })))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const uniqueBattleIds = [...new Set(allPoints.map((p) => p.battleId))];

    uniqueBattleIds.forEach((battleId, index) => {
      const pointsForBattle = allPoints.filter((p) => p.battleId === battleId);
      pointsForBattle.forEach((point) => {
        lastRatings[point.assetId] = point.rating;
      });
      chartData.push({
        matchNumber: index + 1,
        ...lastRatings,
      });
    });

    return { data: chartData, lines };
  }, [rawChartData, statsData]);

  const assetRatingsMap = useMemo(() => {
    if (!rawChartData?.data?.trends?.trends) {
      return new Map<string, number>();
    }
    const trends = rawChartData.data.trends.trends;
    const ratingsMap = new Map<string, number>();
    trends.forEach((trend) => {
      if (trend.assetName && typeof trend.currentRating === 'number') {
        ratingsMap.set(trend.assetName, trend.currentRating);
      }
    });
    return ratingsMap;
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
    <div className="h-full overflow-auto p-6">
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
                    <XAxis dataKey="matchNumber" allowDecimals={false} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    {formattedChartData.lines.map((line) => (
                      <Line
                        key={line.assetId}
                        type="monotone"
                        dataKey={line.assetId}
                        name={line.name}
                        stroke={line.color}
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
                  : (leaderboardData?.items || []).map((entry) => {
                      const wins = parseInt(entry.wins, 10) || 0;
                      const losses = parseInt(entry.losses, 10) || 0;
                      const draws = parseInt(entry.draws, 10) || 0;
                      const totalBattles = wins + losses + draws;
                      const winRate = totalBattles > 0 ? (wins / totalBattles) * 100 : 0;
                      const assetName = entry.asset?.name;
                      const currentRating = assetName ? assetRatingsMap.get(assetName) : undefined;
                      const displayRating = currentRating ?? entry.rating;

                      return (
                        <TableRow key={entry.rank}>
                          <TableCell>{entry.rank}</TableCell>
                          <TableCell>{assetName ?? 'N/A'}</TableCell>
                          <TableCell>
                            {wins}/{losses}/{draws}
                          </TableCell>
                          <TableCell>{totalBattles}</TableCell>
                          <TableCell>{winRate.toFixed(1)}%</TableCell>
                          <TableCell>{typeof displayRating === 'number' ? displayRating.toFixed(0) : 'N/A'}</TableCell>
                        </TableRow>
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
