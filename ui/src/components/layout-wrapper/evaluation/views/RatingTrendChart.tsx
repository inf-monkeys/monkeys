import React, { useEffect, useState } from 'react';

import useSWR from 'swr';
import { useParams } from '@tanstack/react-router';

import ReactECharts from 'echarts-for-react';
import { useTranslation } from 'react-i18next';

import { getChartData } from '@/apis/evaluation';
import { ChartDataTrend } from '@/apis/evaluation/typings';
import { getMediaAsset } from '@/apis/media-data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

// 扩展 ChartDataTrend 以包含可选的 assetUrl
interface TrendWithAssetUrl extends ChartDataTrend {
  assetUrl?: string;
}

export const RatingTrendChart: React.FC = () => {
  const { t } = useTranslation();
  const { moduleId } = useParams({ from: '/$teamId/evaluations/$moduleId/' });
  const [chartOption, setChartOption] = useState<any>(null);

  // 使用 SWR 替换原有的 useEffect + fetch
  const { data: chartData, isLoading } = useSWR(moduleId ? ['chart-data-trends', moduleId] : null, () =>
    getChartData(moduleId!, {
      dataType: 'trends',
      limit: 50,
      minBattles: 2,
    }),
  );

  useEffect(() => {
    if (!chartData?.data?.trends) return;

    const processChartData = async () => {
      try {
        const trendsData: ChartDataTrend[] = chartData.data.trends;

        // 异步获取所有资产的 URL
        const trendsWithUrls: TrendWithAssetUrl[] = await Promise.all(
          trendsData.map(async (trend) => {
            try {
              const asset = await getMediaAsset(trend.assetId);
              return { ...trend, assetUrl: asset.url };
            } catch (e) {
              console.error(`Failed to fetch asset ${trend.assetId}`, e);
              return { ...trend, assetUrl: '' }; // 出错时提供默认值
            }
          }),
        );

        // Create a unified battle timeline by sorting all unique battle dates
        const allPoints = trendsWithUrls.flatMap((t) => t.points);
        const uniqueDates = [...new Set(allPoints.map((p) => p.date))];
        uniqueDates.sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
        const battleTimeline = uniqueDates;

        const maxBattles = battleTimeline.length;
        const xAxisData = Array.from({ length: maxBattles }, (_, i) => `Battle ${i + 1}`);

        const seriesData = trendsWithUrls.map((trend) => {
          // Create a sparse array with ratings placed on the unified timeline
          const sparseRatings = Array(maxBattles).fill(null);
          trend.points.forEach((point) => {
            const index = battleTimeline.indexOf(point.date);
            if (index !== -1) {
              sparseRatings[index] = point.rating;
            }
          });

          // Create the final, filled-in rating series
          const finalRatings = Array(maxBattles).fill(null);
          let lastKnownRating: number | null = null;
          let firstBattleIndex = -1;

          // Find the index of the first battle for this participant
          for (let i = 0; i < maxBattles; i++) {
            if (sparseRatings[i] !== null) {
              firstBattleIndex = i;
              break;
            }
          }

          // Fill ratings forward from the first battle to create continuous lines
          if (firstBattleIndex !== -1) {
            // Start with the rating of the first battle
            lastKnownRating = sparseRatings[firstBattleIndex];

            // Fill all points from the beginning of the timeline
            for (let i = 0; i < maxBattles; i++) {
              // If we are at or after the first battle and have a new rating, update lastKnownRating
              if (i >= firstBattleIndex && sparseRatings[i] !== null) {
                lastKnownRating = sparseRatings[i];
              }

              // Assign the last known rating to the final array
              if (lastKnownRating !== null) {
                finalRatings[i] = lastKnownRating;
              }
            }
          }

          return {
            name: trend.assetName,
            type: 'line',
            smooth: false,
            symbol: 'none', // Do not show individual points
            step: 'end', // Use step line to show rating holds constant between battles
            data: finalRatings,
            assetUrl: trend.assetUrl || '',
          };
        });

        // Calculate y-axis range with padding
        const allRatings = trendsWithUrls.flatMap((t) => t.points.map((p) => p.rating));
        const dataMin = Math.min(...allRatings);
        const dataMax = Math.max(...allRatings);
        const range = dataMax - dataMin;
        // Add 10% padding to both top and bottom, or a minimum of 5 units
        const padding = Math.max(range * 0.2, 10);
        const yAxisMin = Math.floor(dataMin - padding);
        const yAxisMax = Math.ceil(dataMax + padding);

        const option = {
          tooltip: {
            trigger: 'axis',
            formatter: (params: any[]) => {
              let tooltipHtml = `<div class="p-2"><strong>${params[0].axisValueLabel}</strong><br/>`;
              params.forEach((param) => {
                if (param.value !== null && param.seriesName) {
                  // 从 seriesData 中安全地获取 assetUrl
                  const assetUrl = (param.seriesIndex !== undefined && seriesData[param.seriesIndex]?.assetUrl) || '';
                  tooltipHtml += `
                      <div class="flex items-center mt-2">
                        <img src="${assetUrl}" alt="${param.seriesName}" class="w-10 h-10 rounded-md mr-2 object-cover"/>
                        <div>
                          <span>${param.seriesName}: </span>
                          <strong>${Math.round(param.value)}</strong>
                        </div>
                      </div>
                    `;
                }
              });
              tooltipHtml += '</div>';
              return tooltipHtml;
            },
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            borderColor: '#e2e8f0',
            borderWidth: 1,
            textStyle: {
              color: '#1e293b',
            },
          },
          xAxis: {
            type: 'category',
            boundaryGap: false,
            data: xAxisData,
            name: t('ugc-page.evaluation.ratingTrendChart.xAxisName'),
            nameLocation: 'middle',
            nameGap: 30,
          },
          yAxis: {
            type: 'value',
            name: t('ugc-page.evaluation.ratingTrendChart.yAxisName'),
            min: yAxisMin,
            max: yAxisMax,
            axisLabel: {
              formatter: '{value}',
            },
            splitLine: {
              lineStyle: {
                type: 'dashed',
                color: '#e2e8f0',
              },
            },
          },
          grid: {
            left: '3%',
            right: '4%',
            bottom: '20%', // 进一步增加底部边距，为图例和滑块留出充足空间
            containLabel: true,
          },
          legend: {
            type: 'scroll',
            orient: 'horizontal',
            bottom: 40, // 将图例上移到距底部 40px 的位置
            data: trendsWithUrls.map((t) => t.assetName),
          },
          series: seriesData,
          dataZoom: [
            {
              type: 'inside',
              start: 0,
              end: 100,
            },
            {
              start: 0,
              end: 100,
              bottom: 10, // 将滑块固定在距底部 10px 的位置
            },
          ],
        };
        setChartOption(option);
      } catch (error) {
        console.error('Error processing chart data:', error);
      }
    };

    processChartData();
  }, [chartData]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('ugc-page.evaluation.ratingTrendChart.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[700px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!chartOption) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('ugc-page.evaluation.ratingTrendChart.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-[700px] items-center justify-center">
            <p>{t('ugc-page.evaluation.ratingTrendChart.noData')}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('ugc-page.evaluation.ratingTrendChart.title')}</CardTitle>
      </CardHeader>
      <CardContent>
        <ReactECharts option={chartOption} style={{ height: '700px', width: '100%' }} />
      </CardContent>
    </Card>
  );
};
