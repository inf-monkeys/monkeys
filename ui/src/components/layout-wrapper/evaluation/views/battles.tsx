import React, { useRef, useState } from 'react';

import useSWR from 'swr';
import { useParams } from '@tanstack/react-router';

import { get } from 'lodash';
import { AlertCircle, CheckCircle2, Image as ImageIcon, Loader2, Plus, Swords, Target, Upload } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { useSystemConfig } from '@/apis/common';
import {
  EvaluationStatus,
  getAssetsInModule,
  getAvailableAssets,
  getEvaluationStatus,
  getModuleDetails,
  joinEvaluation,
  JoinEvaluationDto,
  RecentBattle,
} from '@/apis/evaluation';
import { getMediaAsset } from '@/apis/media-data';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { EnhancedUploader } from '@/components/ui/enhanced-uploader';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export const BattlesView: React.FC = () => {
  const { t } = useTranslation();
  const { moduleId } = useParams({ from: '/$teamId/evaluations/$moduleId/$tab/' });

  // 获取 OEM 配置
  const { data: oem } = useSystemConfig();
  const themeMode = get(oem, 'theme.themeMode', 'shadow');
  const isShadowMode = themeMode === 'shadow';
  const { roundedClass } = useRoundedClass();

  const [activeTab, setActiveTab] = useState('ongoing');
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [battlesDialogOpen, setBattlesDialogOpen] = useState(false);
  const [evaluationStatus] = useState<EvaluationStatus | null>(null);
  const [recentBattles] = useState<RecentBattle[]>([]);
  const [isStatusLoading] = useState(false);
  const [isBattlesLoading] = useState(false);

  // 加入评测表单数据
  const [joinForm, setJoinForm] = useState({
    selectedAssets: [] as string[],
  });

  // 排行榜图片分页
  const [leaderboardPage, setLeaderboardPage] = useState(1);
  const leaderboardPageSize = 16; // 每页显示16张图片

  // OpenSkill evaluation state
  const [isJoining, setIsJoining] = useState(false);

  // 自动加入排行榜选项
  const [autoJoinToLeaderboard, setAutoJoinToLeaderboard] = useState(true);

  // 获取模块详情
  useSWR(moduleId ? ['evaluation-module', moduleId] : null, () => getModuleDetails(moduleId!));

  // 获取可用图片资产
  const { data: availableAssets, mutate: mutateAvailableAssets } = useSWR(
    moduleId ? ['available-assets', moduleId] : null,
    () => getAvailableAssets(moduleId!, { limit: 100 }),
  );

  // 获取已在排行榜中的资产
  const { data: assetsInModule, mutate: mutateAssetsInModule } = useSWR(
    moduleId ? ['assets-in-module', moduleId] : null,
    () => getAssetsInModule(moduleId!),
  );

  // 获取评测状态
  const { data: currentEvaluationStatus, mutate: mutateEvaluationStatus } = useSWR(
    moduleId ? ['evaluation-status', moduleId] : null,
    () => getEvaluationStatus(moduleId!),
    { refreshInterval: 5000 }, // 每5秒刷新一次
  );

  // 在组件函数体内添加 ref
  const lastAssetIdsRef = useRef<string | null>(null);

  // 处理图片选择
  const handleAssetToggle = (assetId: string) => {
    setJoinForm((prev) => ({
      ...prev,
      selectedAssets: prev.selectedAssets.includes(assetId)
        ? prev.selectedAssets.filter((id) => id !== assetId)
        : [...prev.selectedAssets, assetId],
    }));
  };

  // 加入OpenSkill评测
  const handleJoinEvaluation = async () => {
    if (!moduleId || joinForm.selectedAssets.length === 0) {
      toast.error(t('ugc-page.evaluation.battles.joinDialog.validation.atLeastOne'));
      return;
    }

    try {
      setIsJoining(true);

      const joinDto: JoinEvaluationDto = {
        assetIds: joinForm.selectedAssets,
      };

      const response = await joinEvaluation(moduleId, joinDto);

      toast.success(t('ugc-page.evaluation.battles.joinDialog.success', { count: response.addedCount }));

      // 刷新数据
      mutateAvailableAssets();
      mutateAssetsInModule();
      mutateEvaluationStatus();

      setJoinDialogOpen(false);
      setJoinForm({
        selectedAssets: [],
      });
    } catch (error) {
      console.error('Join evaluation failed:', error);
      toast.error(t('ugc-page.evaluation.battles.joinDialog.error'));
    } finally {
      setIsJoining(false);
    }
  };

  // 自动加入排行榜
  const handleAutoJoinToLeaderboard = async (uploadedAssetIds: string[]) => {
    // 用字符串做唯一性判断，防止重复处理
    // 如果本次 key 和上次一样，说明已经处理过了，直接 return，不再执行后续逻辑。
    // console.log('uploadedAssetIds', uploadedAssetIds);
    const key = uploadedAssetIds.slice().sort().join(',');
    // console.log('key', key);
    // console.log('lastAssetIdsRef.current', lastAssetIdsRef.current);
    if (lastAssetIdsRef.current === key) return;
    lastAssetIdsRef.current = key;

    if (!moduleId || uploadedAssetIds.length === 0) {
      return;
    }

    try {
      const joinDto: JoinEvaluationDto = {
        assetIds: uploadedAssetIds,
      };

      await joinEvaluation(moduleId, joinDto);

      // 显示合并的提示：上传成功并加入排行榜
      toast.success(t('ugc-page.evaluation.battles.uploadDialog.autoJoinSuccess'));

      // 刷新数据
      mutateAvailableAssets();
      mutateAssetsInModule();
      mutateEvaluationStatus();
    } catch (error) {
      console.error('Auto join evaluation failed:', error);
      toast.error(t('ugc-page.evaluation.battles.uploadDialog.autoJoinError'));
    }
  };

  // 查看评测状态

  // 查看最近对战

  // 获取状态徽章

  // OpenSkill系统不再使用tasks概念，直接通过evaluation status获取进度

  const assetsInModuleCount = assetsInModule?.total || 0;
  const availableAssetsCount = availableAssets?.total || 0;

  return (
    <div className={`h-full overflow-auto ${roundedClass} border border-input p-6`}>
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold">
              <Swords className="h-6 w-6" />
              {t('ugc-page.evaluation.battles.title')}
            </h1>
            <p className="text-muted-foreground">{t('ugc-page.evaluation.battles.description')}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setUploadDialogOpen(true)}>
              <Upload className="mr-2 h-4 w-4" />
              {t('ugc-page.evaluation.battles.upload')}
            </Button>
            <Button variant="outline" onClick={() => setJoinDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              {t('ugc-page.evaluation.battles.join')}
            </Button>
          </div>
        </div>

        {/* Battle Stats */}
        <div className="grid grid-cols-1 gap-global md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t('ugc-page.evaluation.battles.stats.available')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{availableAssetsCount}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t('ugc-page.evaluation.battles.stats.inLeaderboard')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{assetsInModuleCount}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t('ugc-page.evaluation.battles.stats.stability')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {currentEvaluationStatus?.progress?.toFixed(1) || 0}%
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t('ugc-page.evaluation.battles.stats.uncertainty')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {currentEvaluationStatus?.averageSigma?.toFixed(2) || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* OpenSkill Evaluation Info */}
        <Card>
          <CardHeader>
            <CardTitle>{t('ugc-page.evaluation.battles.info.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="ongoing">{t('ugc-page.evaluation.battles.info.tabs.status')}</TabsTrigger>
                <TabsTrigger value="completed">{t('ugc-page.evaluation.battles.info.tabs.recentBattles')}</TabsTrigger>
              </TabsList>

              <TabsContent value="ongoing" className="mt-4 space-y-4">
                {currentEvaluationStatus ? (
                  <div className="space-y-4">
                    <div className="rounded-lg border p-global">
                      <div className="flex items-center gap-global">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                          <Target className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <div className="font-medium">
                            {t('ugc-page.evaluation.battles.info.status.progress', {
                              progress: currentEvaluationStatus.progress?.toFixed(1),
                            })}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {t('ugc-page.evaluation.battles.info.status.rounds', {
                              stableRounds: Math.floor(((currentEvaluationStatus.progress || 0) / 100) * 2),
                              neededRounds: 2 - Math.floor(((currentEvaluationStatus.progress || 0) / 100) * 2),
                            })}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {t('ugc-page.evaluation.battles.info.status.avgUncertainty', {
                              sigma: currentEvaluationStatus.averageSigma?.toFixed(2),
                            })}
                          </div>
                        </div>
                      </div>

                      {currentEvaluationStatus.isComplete ? (
                        <div className="mt-3 flex items-center gap-2 text-green-600">
                          <CheckCircle2 className="h-4 w-4" />
                          <span className="text-sm font-medium">
                            {t('ugc-page.evaluation.battles.info.status.completed')}
                          </span>
                        </div>
                      ) : (
                        <div className="mt-3 flex items-center gap-2 text-blue-600">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-sm font-medium">
                            {t('ugc-page.evaluation.battles.info.status.needsMoreBattles', {
                              count: currentEvaluationStatus.needsMoreBattles?.length || 0,
                            })}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="py-8 text-center">
                    <Target className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                    <h3 className="mb-2 text-lg font-medium text-muted-foreground">
                      {t('ugc-page.evaluation.battles.info.noInfo.title')}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {t('ugc-page.evaluation.battles.info.noInfo.description')}
                    </p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="completed" className="mt-4 space-y-4">
                <div className="py-8 text-center">
                  <Swords className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                  <h3 className="mb-2 text-lg font-medium text-muted-foreground">
                    {t('ugc-page.evaluation.battles.info.recentBattles.title')}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {t('ugc-page.evaluation.battles.info.recentBattles.description')}
                  </p>
                  <Button variant="outline" className="mt-4" onClick={() => setBattlesDialogOpen(true)}>
                    {t('ugc-page.evaluation.battles.info.recentBattles.button')}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Assets in Leaderboard */}
        <Card>
          <CardHeader>
            <CardTitle>{t('ugc-page.evaluation.battles.assetsInLeaderboard.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            {assetsInModuleCount > 0 ? (
              <>
                <div className="grid grid-cols-8 gap-global">
                  {assetsInModule?.assetIds
                    .slice((leaderboardPage - 1) * leaderboardPageSize, leaderboardPage * leaderboardPageSize)
                    .map((assetId) => <AssetThumbnail key={assetId} assetId={assetId} />)}
                </div>
                <div className="mt-4 flex items-center justify-end space-x-2">
                  <Button
                    variant="outline"
                    size="small"
                    onClick={() => setLeaderboardPage((prev) => Math.max(prev - 1, 1))}
                    disabled={leaderboardPage === 1}
                  >
                    {t('ugc-page.evaluation.battles.pagination.previous')}
                  </Button>
                  <span className="text-sm">
                    {t('ugc-page.evaluation.battles.pagination.page', {
                      page: leaderboardPage,
                      totalPages: Math.ceil(assetsInModuleCount / leaderboardPageSize),
                    })}
                  </span>
                  <Button
                    variant="outline"
                    size="small"
                    onClick={() => setLeaderboardPage((prev) => prev + 1)}
                    disabled={leaderboardPage * leaderboardPageSize >= assetsInModuleCount}
                  >
                    {t('ugc-page.evaluation.battles.pagination.next')}
                  </Button>
                </div>
              </>
            ) : (
              <div className="py-8 text-center">
                <ImageIcon className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                <p className="text-muted-foreground">
                  {t('ugc-page.evaluation.battles.assetsInLeaderboard.empty.title')}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t('ugc-page.evaluation.battles.assetsInLeaderboard.empty.description')}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 加入评测对话框 */}
        <Dialog open={joinDialogOpen} onOpenChange={setJoinDialogOpen}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>{t('ugc-page.evaluation.battles.joinDialog.title')}</DialogTitle>
              <DialogDescription>{t('ugc-page.evaluation.battles.joinDialog.description')}</DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* 图片选择区域 */}
              <div>
                <Label className="text-base font-medium">
                  {t('ugc-page.evaluation.battles.joinDialog.selectPrompt')}
                </Label>
                <p className="mb-4 text-sm text-muted-foreground">
                  {t('ugc-page.evaluation.battles.joinDialog.selectedCount', { count: joinForm.selectedAssets.length })}
                </p>

                <div className="max-h-60 overflow-y-auto rounded-lg border p-global">
                  {availableAssets?.data && availableAssets.data.length > 0 ? (
                    <div className="grid grid-cols-6 gap-global">
                      {availableAssets.data
                        .filter((asset) => asset.type.startsWith('image/'))
                        .map((asset) => (
                          <div
                            key={asset.id}
                            className={`relative cursor-pointer rounded-lg border-2 transition-all ${
                              joinForm.selectedAssets.includes(asset.id)
                                ? 'border-primary bg-primary/10'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                            onClick={() => handleAssetToggle(asset.id)}
                          >
                            <div className="aspect-square">
                              <img
                                src={asset.url}
                                alt={asset.displayName}
                                className="h-full w-full rounded-lg object-cover"
                              />
                            </div>
                            <div className="absolute right-1 top-1">
                              <Checkbox checked={joinForm.selectedAssets.includes(asset.id)} onChange={() => {}} />
                            </div>
                            <div className="p-1">
                              <p className="truncate text-xs" title={asset.displayName}>
                                {asset.displayName}
                              </p>
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="py-8 text-center">
                      <ImageIcon className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                      <p className="text-muted-foreground">{t('ugc-page.evaluation.battles.joinDialog.empty.title')}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {t('ugc-page.evaluation.battles.joinDialog.empty.description')}
                      </p>
                      <Button variant="outline" className="mt-2" onClick={() => setUploadDialogOpen(true)}>
                        <Upload className="mr-2 h-4 w-4" />
                        {t('ugc-page.evaluation.battles.joinDialog.empty.uploadButton')}
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* OpenSkill说明 */}
              <div className="rounded-lg bg-blue-50 p-global">
                <h4 className="mb-2 font-medium text-blue-800">
                  {t('ugc-page.evaluation.battles.joinDialog.systemInfo.title')}
                </h4>
                <ul className="space-y-1 text-sm text-blue-700">
                  {(
                    t('ugc-page.evaluation.battles.joinDialog.systemInfo.rules', {
                      returnObjects: true,
                    }) as string[]
                  ).map((rule, i) => (
                    <li key={i}>• {rule}</li>
                  ))}
                </ul>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setJoinDialogOpen(false)} disabled={isJoining}>
                {t('ugc-page.evaluation.battles.joinDialog.cancel')}
              </Button>
              <Button onClick={handleJoinEvaluation} disabled={isJoining || joinForm.selectedAssets.length === 0}>
                {isJoining ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('ugc-page.evaluation.battles.joinDialog.joining')}
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    {t('ugc-page.evaluation.battles.joinDialog.confirm', { count: joinForm.selectedAssets.length })}
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* 上传图片对话框 */}
        <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
          <DialogContent className="w-[50rem] max-w-[50rem]">
            <DialogHeader>
              <DialogTitle>{t('ugc-page.evaluation.battles.uploadDialog.title')}</DialogTitle>
              <DialogDescription>{t('ugc-page.evaluation.battles.uploadDialog.description')}</DialogDescription>
            </DialogHeader>

            {/* 自动加入排行榜选项 */}
            <div className="flex items-center space-x-2 rounded-lg border bg-blue-50 p-global">
              <Checkbox
                id="auto-join-leaderboard"
                checked={autoJoinToLeaderboard}
                onCheckedChange={(checked) => setAutoJoinToLeaderboard(checked === true)}
              />
              <div className="grid gap-1.5 leading-none">
                <Label
                  htmlFor="auto-join-leaderboard"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {t('ugc-page.evaluation.battles.uploadDialog.autoJoin.label')}
                </Label>
                <p className="text-xs text-muted-foreground">
                  {t('ugc-page.evaluation.battles.uploadDialog.autoJoin.description')}
                </p>
              </div>
            </div>

            <EnhancedUploader
              maxSize={30}
              maxFiles={1000}
              accept={['png', 'jpeg', 'jpg', 'webp']}
              onChange={(urls) => {
                if (urls.length > 0) {
                  mutateAvailableAssets();
                  setUploadDialogOpen(false);
                  // 只有在不自动加入排行榜时才显示上传成功提示
                  if (!autoJoinToLeaderboard) {
                    toast.success(t('ugc-page.evaluation.battles.uploadDialog.uploadSuccess', { count: urls.length }));
                  }
                }
              }}
              onAssetsCreated={(assetIds) => {
                // console.log('onAssetsCreated', assetIds);
                if (autoJoinToLeaderboard && assetIds.length > 0) {
                  handleAutoJoinToLeaderboard(assetIds);
                }
              }}
              onProgress={(progress, completed, total) => {
                if (total > 0) {
                  // 可以在这里显示进度或做其他处理
                }
              }}
              basePath="user-files/media"
            />
          </DialogContent>
        </Dialog>

        {/* 评测状态对话框 */}
        <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{t('ugc-page.evaluation.battles.statusDialog.title')}</DialogTitle>
              <DialogDescription>{t('ugc-page.evaluation.battles.statusDialog.description')}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {isStatusLoading ? (
                <div className="flex h-48 items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : evaluationStatus ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-global">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        {t('ugc-page.evaluation.battles.statusDialog.status')}
                      </label>
                      <div
                        className={`flex items-center gap-2 ${
                          evaluationStatus.isComplete ? 'text-green-600' : 'text-blue-600'
                        }`}
                      >
                        {evaluationStatus.isComplete ? (
                          <CheckCircle2 className="h-5 w-5" />
                        ) : (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        )}
                        <span className="font-medium">
                          {evaluationStatus.isComplete
                            ? t('ugc-page.evaluation.leaderboard.status.completed')
                            : t('ugc-page.evaluation.leaderboard.status.inProgress')}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        {t('ugc-page.evaluation.battles.statusDialog.progress')}
                      </label>
                      <div className="text-2xl font-bold text-purple-600">{evaluationStatus.progress.toFixed(1)}%</div>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium">
                      {t('ugc-page.evaluation.battles.statusDialog.progress')}
                    </label>
                    <Progress value={evaluationStatus.progress} className="mt-2 h-3" />
                    <p className="mt-1 text-xs text-muted-foreground">
                      {t('ugc-page.evaluation.battles.statusDialog.progressDetail', {
                        stableRounds: Math.floor(((evaluationStatus.progress || 0) / 100) * 2),
                        neededRounds: 2 - Math.floor(((evaluationStatus.progress || 0) / 100) * 2),
                      })}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-global">
                    <div className="rounded-lg bg-blue-50 p-3 text-center">
                      <div className="text-2xl font-bold text-blue-600">{evaluationStatus.totalAssets}</div>
                      <div className="text-sm text-muted-foreground">
                        {t('ugc-page.evaluation.battles.statusDialog.totalAssets')}
                      </div>
                    </div>
                    <div className="rounded-lg bg-orange-50 p-3 text-center">
                      <div className="text-2xl font-bold text-orange-600">
                        {evaluationStatus.averageSigma.toFixed(2)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {t('ugc-page.evaluation.battles.statusDialog.avgUncertainty')}
                      </div>
                    </div>
                  </div>

                  {evaluationStatus.needsMoreBattles.length > 0 && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        {t('ugc-page.evaluation.battles.statusDialog.needsMoreBattles')}
                      </label>
                      <div className="max-h-32 overflow-y-auto">
                        <div className="space-y-1">
                          {evaluationStatus.needsMoreBattles.map((assetId) => (
                            <div key={assetId} className="rounded bg-gray-50 px-2 py-1 text-sm text-muted-foreground">
                              {assetId.substring(0, 8)}...
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  <AlertCircle className="mx-auto mb-2 h-8 w-8" />
                  <p>{t('ugc-page.evaluation.battles.statusDialog.noStatus')}</p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setStatusDialogOpen(false)}>
                {t('ugc-page.evaluation.battles.statusDialog.close')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* 最近对战对话框 */}
        <Dialog open={battlesDialogOpen} onOpenChange={setBattlesDialogOpen}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>{t('ugc-page.evaluation.battles.battlesDialog.title')}</DialogTitle>
              <DialogDescription>{t('ugc-page.evaluation.battles.battlesDialog.description')}</DialogDescription>
            </DialogHeader>
            <div className="max-h-[60vh] overflow-y-auto">
              {isBattlesLoading ? (
                <div className="flex h-48 items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <div className="space-y-3">
                  {recentBattles.map((battle) => (
                    <div key={battle.battleId} className="rounded-lg border p-global">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-global">
                          <div className="text-sm">
                            <div className="font-medium">
                              {battle.assetAId.substring(0, 8)}... {t('ugc-page.evaluation.battles.battlesDialog.vs')}{' '}
                              {battle.assetBId.substring(0, 8)}...
                            </div>
                            <div className="text-muted-foreground">{new Date(battle.timestamp).toLocaleString()}</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-global">
                          {battle.oldRatingA && battle.newRatingA && (
                            <div className="text-center text-sm">
                              <div className="text-muted-foreground">A: {battle.oldRatingA.toFixed(0)}</div>
                              <div
                                className={`font-medium ${
                                  battle.newRatingA > battle.oldRatingA ? 'text-green-600' : 'text-red-600'
                                }`}
                              >
                                → {battle.newRatingA.toFixed(0)}
                              </div>
                            </div>
                          )}

                          <div className="text-center">
                            {battle.winner === 'A' && (
                              <Badge className="bg-green-500">
                                {t('ugc-page.evaluation.battles.battlesDialog.winner.a')}
                              </Badge>
                            )}
                            {battle.winner === 'B' && (
                              <Badge className="bg-blue-500">
                                {t('ugc-page.evaluation.battles.battlesDialog.winner.b')}
                              </Badge>
                            )}
                            {battle.winner === 'DRAW' && (
                              <Badge variant="secondary">
                                {t('ugc-page.evaluation.battles.battlesDialog.winner.draw')}
                              </Badge>
                            )}
                          </div>

                          {battle.oldRatingB && battle.newRatingB && (
                            <div className="text-center text-sm">
                              <div className="text-muted-foreground">B: {battle.oldRatingB.toFixed(0)}</div>
                              <div
                                className={`font-medium ${
                                  battle.newRatingB > battle.oldRatingB ? 'text-green-600' : 'text-red-600'
                                }`}
                              >
                                → {battle.newRatingB.toFixed(0)}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {recentBattles.length === 0 && (
                    <div className="py-8 text-center text-muted-foreground">
                      <Swords className="mx-auto mb-2 h-8 w-8" />
                      <p>{t('ugc-page.evaluation.battles.battlesDialog.noBattles')}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setBattlesDialogOpen(false)}>
                {t('ugc-page.evaluation.battles.battlesDialog.close')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

const AssetThumbnail: React.FC<{ assetId: string }> = ({ assetId }) => {
  const { data: asset } = useSWR(['media-asset', assetId], () => getMediaAsset(assetId));

  if (!asset) {
    return <Skeleton className="aspect-square w-full" />;
  }

  return (
    <div className="aspect-square">
      <img src={asset.url} alt={asset.displayName} className="h-full w-full rounded-lg object-cover" />
    </div>
  );
};
