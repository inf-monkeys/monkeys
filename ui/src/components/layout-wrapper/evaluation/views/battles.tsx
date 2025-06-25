import React, { useState } from 'react';

import useSWR from 'swr';
import { useParams } from '@tanstack/react-router';

import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  Eye,
  Image as ImageIcon,
  Loader2,
  Plus,
  Swords,
  Target,
  Upload,
  X,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import {
  createBattleGroup,
  getModuleDetails,
  getTaskDetails,
  getUserTasks,
  startAutoEvaluation,
  subscribeToTaskProgress,
} from '@/apis/evaluation';
import {
  Battle,
  BattleStrategy,
  CreateBattleGroupDto,
  EvaluationTask,
  MediaAsset,
  TaskProgress,
} from '@/apis/evaluation/typings';
import { vinesFetcher } from '@/apis/fetcher';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { VinesUploader } from '@/components/ui/vines-uploader';

export const BattlesView: React.FC = () => {
  useTranslation();
  const { moduleId } = useParams({ from: '/$teamId/evaluations/$moduleId/$tab/' });

  const [activeTab, setActiveTab] = useState('ongoing');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [resultsDialogOpen, setResultsDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<EvaluationTask | null>(null);
  const [taskResults, setTaskResults] = useState<Battle[] | null>(null);
  const [isResultsLoading, setIsResultsLoading] = useState(false);

  // 创建对战表单数据
  const [battleForm, setBattleForm] = useState({
    selectedAssets: [] as string[],
    strategy: 'RANDOM_PAIRS' as BattleStrategy,
    battleCount: 200,
    description: '',
  });

  const maxBattles = React.useMemo(() => {
    const n = battleForm.selectedAssets.length;
    if (n < 2) return 0;
    return (n * (n - 1)) / 2;
  }, [battleForm.selectedAssets]);

  // 当选择的图片数量变化时，确保 battleCount 不会超过最大值
  React.useEffect(() => {
    if (battleForm.strategy === 'RANDOM_PAIRS' && battleForm.battleCount > maxBattles && maxBattles > 0) {
      setBattleForm((prev) => ({
        ...prev,
        battleCount: maxBattles,
      }));
    }
  }, [maxBattles, battleForm.strategy]);

  // 任务进度状态
  const [currentTask, setCurrentTask] = useState<{ id: string; progress: TaskProgress } | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // 获取模块详情
  useSWR(moduleId ? ['evaluation-module', moduleId] : null, () => getModuleDetails(moduleId!));

  // 获取用户任务列表
  const { data: tasksData, mutate: mutateTasks } = useSWR('evaluation-tasks', () => getUserTasks({ limit: 10 }));

  // 获取媒体资产列表
  const { data: mediaAssets, mutate: mutateMedia } = useSWR('media-assets', () =>
    vinesFetcher<MediaAsset[]>({
      simple: true,
    })('/api/media-files?limit=100').then((result) => {
      if (Array.isArray(result)) {
        const processedResult = result.map((asset) => {
          try {
            // Check if it's a valid absolute URL
            const url = new URL(asset.url);
            // If the origin is the same as the app's origin, convert to relative path
            if (url.origin === window.location.origin) {
              return {
                ...asset,
                url: `${url.pathname}${url.search}`,
              };
            }
            // It's an external URL (like S3), keep it as is
            return asset;
          } catch (e) {
            // It's already a relative path or invalid, keep it as is
            return asset;
          }
        });
        const processedData = { data: processedResult, total: processedResult.length };
        return processedData;
      }
      return { data: [], total: 0 };
    }),
  );

  // 处理图片选择
  const handleAssetToggle = (assetId: string) => {
    setBattleForm((prev) => ({
      ...prev,
      selectedAssets: prev.selectedAssets.includes(assetId)
        ? prev.selectedAssets.filter((id) => id !== assetId)
        : [...prev.selectedAssets, assetId],
    }));
  };

  // 创建对战组
  const handleCreateBattleGroup = async () => {
    if (!moduleId || battleForm.selectedAssets.length < 2) {
      toast.error('请至少选择2个参与者');
      return;
    }

    try {
      setIsCreating(true);

      const battleGroupDto: CreateBattleGroupDto = {
        assetIds: battleForm.selectedAssets,
        strategy: battleForm.strategy,
        description:
          battleForm.description || `${battleForm.strategy}策略 - ${battleForm.selectedAssets.length}个参与者`,
      };

      if (battleForm.strategy === 'RANDOM_PAIRS') {
        battleGroupDto.battleCount = battleForm.battleCount;
      }

      const createResponse = await createBattleGroup(moduleId, battleGroupDto);

      const battleGroupId = createResponse?.id;

      if (!battleGroupId) {
        toast.error('创建对战组失败：无法从服务器响应中获取对战组ID');
        throw new Error('Failed to get battleGroupId from create response');
      }

      // 启动自动评测
      const { taskId } = await startAutoEvaluation(battleGroupId);

      // 设置当前任务并监听进度
      setCurrentTask({
        id: taskId,
        progress: {
          total:
            battleForm.strategy === 'RANDOM_PAIRS'
              ? battleForm.battleCount
              : (battleForm.selectedAssets.length * (battleForm.selectedAssets.length - 1)) / 2,
          completed: 0,
          failed: 0,
          percentage: 0,
          current: '启动评测任务...',
        },
      });

      // 订阅SSE进度更新
      const eventSource = subscribeToTaskProgress(
        taskId,
        (progressData) => {
          setCurrentTask((prev) =>
            prev
              ? {
                  ...prev,
                  progress: progressData.progress,
                }
              : null,
          );
        },
        (error) => {
          console.error('SSE Error:', error);
          setCurrentTask(null);
          toast.error('进度监听连接中断');
        },
      );

      // 监听任务完成
      eventSource.addEventListener('close', () => {
        setCurrentTask(null);
        mutateTasks();
        toast.success('对战评测任务已完成');
      });

      setCreateDialogOpen(false);
      setBattleForm({
        selectedAssets: [],
        strategy: 'RANDOM_PAIRS',
        battleCount: 200,
        description: '',
      });

      toast.success('对战组创建成功，正在启动评测...');
    } catch (error) {
      console.error('Create battle group failed:', error);
      toast.error('创建对战组失败，请稍后重试');
    } finally {
      setIsCreating(false);
    }
  };

  // 查看结果
  const handleViewResults = async (task: EvaluationTask) => {
    setSelectedTask(task);
    setResultsDialogOpen(true);
    setIsResultsLoading(true);
    try {
      // 根据 API 文档，我们应该调用 getTaskDetails
      const taskDetails = await getTaskDetails(task.id);
      if (taskDetails && taskDetails.battles) {
        setTaskResults(taskDetails.battles);
      } else {
        setTaskResults([]);
        toast.info('该任务没有详细的对战记录。');
      }
    } catch (error) {
      toast.error('获取对战结果失败');
    } finally {
      setIsResultsLoading(false);
    }
  };

  // 获取状态徽章
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'processing':
        return (
          <Badge className="bg-blue-500">
            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
            进行中
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="secondary">
            <Clock className="mr-1 h-3 w-3" />
            等待中
          </Badge>
        );
      case 'completed':
        return (
          <Badge className="bg-green-500">
            <CheckCircle2 className="mr-1 h-3 w-3" />
            已完成
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="destructive">
            <AlertCircle className="mr-1 h-3 w-3" />
            失败
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge variant="outline">
            <X className="mr-1 h-3 w-3" />
            已取消
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const ongoingTasks =
    tasksData?.data?.filter((task) => task.status === 'processing' || task.status === 'pending') || [];

  const completedTasks =
    tasksData?.data?.filter(
      (task) => task.status === 'completed' || task.status === 'failed' || task.status === 'cancelled',
    ) || [];

  return (
    <div className="h-full overflow-auto p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold">
              <Swords className="h-6 w-6" />
              对战管理
            </h1>
            <p className="text-muted-foreground">创建和管理图片对战评测任务</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setUploadDialogOpen(true)}>
              <Upload className="mr-2 h-4 w-4" />
              上传图片
            </Button>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              创建对战
            </Button>
          </div>
        </div>

        {/* 当前任务进度 */}
        {currentTask && (
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-700">
                <Loader2 className="h-5 w-5 animate-spin" />
                评测进行中
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>{currentTask.progress.current}</span>
                  <span>
                    {currentTask.progress.completed}/{currentTask.progress.total}
                  </span>
                </div>
                <Progress value={currentTask.progress.percentage} className="h-2" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>已完成: {currentTask.progress.completed}</span>
                  <span>失败: {currentTask.progress.failed}</span>
                  <span>进度: {currentTask.progress.percentage.toFixed(1)}%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Battle Stats */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">总任务数</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tasksData?.total || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">进行中</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{ongoingTasks.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">已完成</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {completedTasks.filter((t) => t.status === 'completed').length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">可用图片</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{mediaAssets?.total || 0}</div>
            </CardContent>
          </Card>
        </div>

        {/* Battle List */}
        <Card>
          <CardHeader>
            <CardTitle>任务列表</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="ongoing">进行中 ({ongoingTasks.length})</TabsTrigger>
                <TabsTrigger value="completed">已完成 ({completedTasks.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="ongoing" className="mt-4 space-y-4">
                {ongoingTasks.length === 0 ? (
                  <div className="py-8 text-center">
                    <Swords className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                    <h3 className="mb-2 text-lg font-medium text-muted-foreground">暂无进行中的任务</h3>
                    <p className="text-sm text-muted-foreground">点击『创建对战』开始新的评测任务</p>
                  </div>
                ) : (
                  ongoingTasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                          <Swords className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <div className="font-medium">任务 {task.id.slice(-8)}</div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              <span>{new Date(task.createdAt).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span>
                                {task.startedAt
                                  ? `运行 ${Math.round((Date.now() - new Date(task.startedAt).getTime()) / 60000)} 分钟`
                                  : '等待开始'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {getStatusBadge(task.status)}
                        <Button variant="outline" size="small">
                          <Eye className="mr-1 h-3 w-3" />
                          查看详情
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </TabsContent>

              <TabsContent value="completed" className="mt-4 space-y-4">
                {completedTasks.length === 0 ? (
                  <div className="py-8 text-center">
                    <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                    <h3 className="mb-2 text-lg font-medium text-muted-foreground">暂无已完成的任务</h3>
                    <p className="text-sm text-muted-foreground">完成的任务将在这里显示</p>
                  </div>
                ) : (
                  completedTasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                            task.status === 'completed'
                              ? 'bg-green-100'
                              : task.status === 'failed'
                                ? 'bg-red-100'
                                : 'bg-gray-100'
                          }`}
                        >
                          <Swords
                            className={`h-5 w-5 ${
                              task.status === 'completed'
                                ? 'text-green-600'
                                : task.status === 'failed'
                                  ? 'text-red-600'
                                  : 'text-gray-600'
                            }`}
                          />
                        </div>
                        <div>
                          <div className="font-medium">任务 {task.id.slice(-8)}</div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              <span>{new Date(task.createdAt).toLocaleDateString()}</span>
                            </div>
                            {task.finishedAt && (
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                <span>
                                  耗时{' '}
                                  {Math.round(
                                    (new Date(task.finishedAt).getTime() - new Date(task.createdAt).getTime()) / 60000,
                                  )}{' '}
                                  分钟
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {getStatusBadge(task.status)}
                        <Button variant="outline" size="small" onClick={() => handleViewResults(task)}>
                          <Eye className="mr-1 h-3 w-3" />
                          查看结果
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* 创建对战对话框 */}
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>创建对战</DialogTitle>
              <DialogDescription>选择参与者并配置对战参数</DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* 图片选择区域 */}
              <div>
                <Label className="text-base font-medium">选择参与者图片</Label>
                <p className="mb-4 text-sm text-muted-foreground">
                  已选择 {battleForm.selectedAssets.length} 个图片，至少需要选择 2 个
                </p>

                <div className="max-h-60 overflow-y-auto rounded-lg border p-4">
                  {mediaAssets?.data && mediaAssets.data.length > 0 ? (
                    <div className="grid grid-cols-6 gap-4">
                      {mediaAssets.data
                        .filter((asset) => asset.type.startsWith('image/'))
                        .map((asset) => (
                          <div
                            key={asset.id}
                            className={`relative cursor-pointer rounded-lg border-2 transition-all ${
                              battleForm.selectedAssets.includes(asset.id)
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
                              <Checkbox checked={battleForm.selectedAssets.includes(asset.id)} onChange={() => {}} />
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
                      <p className="text-muted-foreground">暂无可用图片</p>
                      <Button variant="outline" className="mt-2" onClick={() => setUploadDialogOpen(true)}>
                        <Upload className="mr-2 h-4 w-4" />
                        上传图片
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* 对战配置 */}
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="strategy">对战策略</Label>
                    <Select
                      value={battleForm.strategy}
                      onValueChange={(value: BattleStrategy) => setBattleForm((prev) => ({ ...prev, strategy: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="选择对战策略" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="RANDOM_PAIRS">随机配对</SelectItem>
                        <SelectItem value="ROUND_ROBIN">循环赛制</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {battleForm.strategy === 'RANDOM_PAIRS'
                        ? '随机选择参与者进行对战，可自定义对战次数'
                        : '每个参与者与其他所有参与者都进行一次对战'}
                    </p>
                  </div>

                  {battleForm.strategy === 'RANDOM_PAIRS' && (
                    <div>
                      <Label htmlFor="battleCount">对战次数</Label>
                      <Input
                        id="battleCount"
                        type="number"
                        value={battleForm.battleCount}
                        onChange={(value) => {
                          const count = parseInt(value);
                          setBattleForm((prev) => ({
                            ...prev,
                            battleCount: isNaN(count) ? 0 : Math.min(count, maxBattles),
                          }));
                        }}
                        placeholder="200"
                        max={maxBattles}
                        disabled={maxBattles === 0}
                      />
                      <p className="mt-1 text-xs text-muted-foreground">
                        基于当前选择的 {battleForm.selectedAssets.length} 个参与者，最多可进行 {maxBattles} 场对战。
                      </p>
                    </div>
                  )}

                  {battleForm.strategy === 'ROUND_ROBIN' && battleForm.selectedAssets.length > 0 && (
                    <div className="rounded-lg bg-blue-50 p-3">
                      <p className="text-sm text-blue-700">
                        循环赛制将产生{' '}
                        {Math.floor((battleForm.selectedAssets.length * (battleForm.selectedAssets.length - 1)) / 2)}{' '}
                        场对战
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <Label htmlFor="description">描述（可选）</Label>
                  <Textarea
                    id="description"
                    value={battleForm.description}
                    onChange={(e) => setBattleForm((prev) => ({ ...prev, description: e.target.value }))}
                    placeholder="输入对战描述..."
                    rows={4}
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)} disabled={isCreating}>
                取消
              </Button>
              <Button onClick={handleCreateBattleGroup} disabled={isCreating || battleForm.selectedAssets.length < 2}>
                {isCreating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    创建中...
                  </>
                ) : (
                  <>
                    <Target className="mr-2 h-4 w-4" />
                    创建对战
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* 上传图片对话框 */}
        <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
          <DialogContent className="w-[40rem] max-w-[40rem]">
            <DialogHeader>
              <DialogTitle>上传图片</DialogTitle>
              <DialogDescription>上传用于对战评测的图片文件</DialogDescription>
            </DialogHeader>
            <VinesUploader
              maxSize={30}
              accept={['png', 'jpeg', 'jpg']}
              onChange={() => {
                mutateMedia();
                setUploadDialogOpen(false);
                toast.success('图片上传成功');
              }}
              basePath="user-files/media"
            />
          </DialogContent>
        </Dialog>

        {/* 查看结果对话框 */}
        <Dialog
          open={resultsDialogOpen}
          onOpenChange={(isOpen) => {
            setResultsDialogOpen(isOpen);
            if (!isOpen) {
              setTaskResults(null);
              setSelectedTask(null);
            }
          }}
        >
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>对战结果 - 任务 {selectedTask?.id.slice(-8)}</DialogTitle>
              <DialogDescription>共 {taskResults?.length || 0} 场对战。这里展示了详细的对战记录。</DialogDescription>
            </DialogHeader>
            <div className="max-h-[60vh] overflow-y-auto">
              {isResultsLoading ? (
                <div className="flex h-48 items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <div className="space-y-4 p-1">
                  {taskResults?.map((battle) => (
                    <div key={battle.id} className="rounded-lg border p-4">
                      <div className="grid grid-cols-3 items-center gap-4">
                        {/* Asset A */}
                        <div
                          className={`flex flex-col items-center gap-2 rounded-md p-2 ${
                            battle.result === 'A_WIN' ? 'bg-green-100 ring-2 ring-green-500' : ''
                          }`}
                        >
                          <img
                            src={battle.assetA?.url}
                            alt={battle.assetA?.displayName}
                            className="h-24 w-24 rounded-md object-cover"
                          />
                          <span className="text-xs font-medium">{battle.assetA?.displayName ?? '参与者 A'}</span>
                        </div>

                        {/* Result */}
                        <div className="text-center">
                          <div className="font-bold">VS</div>
                          {battle.result === 'A_WIN' && <Badge className="mt-2 bg-green-500">A 获胜</Badge>}
                          {battle.result === 'B_WIN' && <Badge className="mt-2 bg-blue-500">B 获胜</Badge>}
                          {battle.result === 'DRAW' && (
                            <Badge className="mt-2" variant="secondary">
                              平局
                            </Badge>
                          )}
                        </div>

                        {/* Asset B */}
                        <div
                          className={`flex flex-col items-center gap-2 rounded-md p-2 ${
                            battle.result === 'B_WIN' ? 'bg-blue-100 ring-2 ring-blue-500' : ''
                          }`}
                        >
                          <img
                            src={battle.assetB?.url}
                            alt={battle.assetB?.displayName}
                            className="h-24 w-24 rounded-md object-cover"
                          />
                          <span className="text-xs font-medium">{battle.assetB?.displayName ?? '参与者 B'}</span>
                        </div>
                      </div>
                      {battle.reason && (
                        <div className="mt-3 rounded-md bg-gray-50 p-3 text-sm">
                          <p className="font-semibold">评判理由:</p>
                          <p className="text-muted-foreground">{battle.reason}</p>
                        </div>
                      )}
                    </div>
                  ))}
                  {taskResults?.length === 0 && (
                    <div className="py-8 text-center text-muted-foreground">
                      <Swords className="mx-auto mb-2 h-8 w-8" />
                      <p>暂无对战结果</p>
                    </div>
                  )}
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setResultsDialogOpen(false)}>
                关闭
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};
