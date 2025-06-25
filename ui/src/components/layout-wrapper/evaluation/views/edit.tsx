import React, { useEffect, useState } from 'react';

import useSWR from 'swr';
import { useParams } from '@tanstack/react-router';

import { Globe, Save, Settings, Target, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import {
  addEvaluatorToModule,
  addParticipantsToModule,
  createEvaluator,
  getModuleDetails,
  getModuleEvaluators,
  updateEvaluationModule,
} from '@/apis/evaluation';
import { CreateEvaluatorDto, Evaluator } from '@/apis/evaluation/typings';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';

export const EditView: React.FC = () => {
  const { t } = useTranslation();
  const { moduleId } = useParams({ from: '/$teamId/evaluations/$moduleId/$tab/' });

  const { data: module, mutate } = useSWR(moduleId ? ['evaluation-module', moduleId] : null, () =>
    getModuleDetails(moduleId),
  );

  const { data: evaluators, mutate: mutateEvaluators } = useSWR(moduleId ? ['module-evaluators', moduleId] : null, () =>
    getModuleEvaluators(moduleId),
  );

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    displayName: '',
    description: '',
    evaluationCriteria: '',
    isActive: true,
    initialRating: '1500',
    ratingDeviation: '350',
  });

  const [participantDialogOpen, setParticipantDialogOpen] = useState(false);
  const [newParticipantIds, setNewParticipantIds] = useState('');
  const [isAddingParticipants, setIsAddingParticipants] = useState(false);

  const [evaluatorDialogOpen, setEvaluatorDialogOpen] = useState(false);
  const [isAddingEvaluator, setIsAddingEvaluator] = useState(false);
  const [newEvaluator, setNewEvaluator] = useState<Omit<CreateEvaluatorDto, 'type'>>({
    name: '',
    llmModelName: '',
    evaluationFocus: '',
  });

  // 当模块数据加载完成时初始化表单数据
  useEffect(() => {
    if (module && !isEditing) {
      setFormData({
        displayName: module.displayName || '',
        description: module.description || '',
        evaluationCriteria: module.evaluationCriteria || '',
        isActive: module.isActive ?? true,
        initialRating: String(module.glickoConfig?.rating || 1500),
        ratingDeviation: String(module.glickoConfig?.rd || 350),
      });
    }
  }, [module, isEditing]);

  const handleSave = async () => {
    if (!moduleId) {
      toast.error(t('common.utils.unknown'));
      return;
    }

    try {
      setIsSaving(true);
      const updateData: {
        displayName?: string;
        description?: string;
        evaluationCriteria?: string;
        isActive?: boolean;
        glickoConfig?: {
          rating?: number;
          rd?: number;
        };
      } = {};

      if ((formData.displayName || '').trim()) {
        updateData.displayName = (formData.displayName || '').trim();
      }
      if ((formData.description || '').trim()) {
        updateData.description = (formData.description || '').trim();
      }
      if ((formData.evaluationCriteria || '').trim()) {
        updateData.evaluationCriteria = (formData.evaluationCriteria || '').trim();
      }
      updateData.isActive = formData.isActive;
      updateData.glickoConfig = {
        rating: parseInt(formData.initialRating, 10) || 1500,
        rd: parseInt(formData.ratingDeviation, 10) || 350,
      };

      await updateEvaluationModule(moduleId, updateData);
      await mutate();
      setIsEditing(false);
      toast.success(t('common.save.success', '保存成功！'));
    } catch (error) {
      toast.error(t('common.save.error', '保存失败！请稍候重试！'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddParticipants = async () => {
    if (!moduleId || !newParticipantIds.trim()) {
      toast.error('请输入参与者ID');
      return;
    }

    try {
      setIsAddingParticipants(true);

      const assetIds = newParticipantIds
        .split(',')
        .map((id) => id.trim())
        .filter((id) => id.length > 0);

      if (assetIds.length === 0) {
        toast.error('请输入有效的参与者ID');
        return;
      }

      await addParticipantsToModule(moduleId, { assetIds });
      await mutate();
      setParticipantDialogOpen(false);
      setNewParticipantIds('');
      toast.success(`成功添加 ${assetIds.length} 个参与者`);
    } catch (error) {
      toast.error('添加参与者失败，请稍候重试');
    } finally {
      setIsAddingParticipants(false);
    }
  };

  const handleCreateAndAddEvaluator = async () => {
    if (!moduleId || !newEvaluator.name.trim() || !newEvaluator.llmModelName?.trim()) {
      toast.error('评测员名称和LLM模型名称不能为空');
      return;
    }

    try {
      setIsAddingEvaluator(true);
      const createData: CreateEvaluatorDto = {
        ...newEvaluator,
        type: 'llm',
      };

      // 1. 创建评测员
      const createdEvaluator: Evaluator = await createEvaluator(createData);
      toast.success(`评测员 "${createdEvaluator.name}" 创建成功`);

      // 2. 添加到模块
      await addEvaluatorToModule(moduleId, { evaluatorId: createdEvaluator.id });
      toast.success(`评测员已成功关联到当前模块`);

      await mutateEvaluators();
      setEvaluatorDialogOpen(false);
      setNewEvaluator({ name: '', llmModelName: '', evaluationFocus: '' });
    } catch (error) {
      toast.error('操作失败，请稍候重试');
    } finally {
      setIsAddingEvaluator(false);
    }
  };

  if (!module) {
    return (
      <div className="h-full overflow-auto p-6">
        <div className="mx-auto max-w-2xl">
          <div className="animate-pulse space-y-6">
            <div className="h-8 rounded bg-muted"></div>
            <div className="h-32 rounded bg-muted"></div>
            <div className="h-32 rounded bg-muted"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto p-6">
      <div className="mx-auto max-w-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold">
              <Settings className="h-6 w-6" />
              {t('evaluation.edit.title')}
            </h1>
            <p className="text-muted-foreground">{t('evaluation.edit.description')}</p>
          </div>
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <Button variant="outline" onClick={() => setIsEditing(false)} disabled={isSaving}>
                  {t('common.utils.cancel')}
                </Button>
                <Button onClick={handleSave} disabled={isSaving || !(formData.displayName || '').trim()}>
                  <Save className="mr-2 h-4 w-4" />
                  {isSaving ? t('common.save.loading', '保存中...') : t('common.utils.save')}
                </Button>
              </>
            ) : (
              <Button
                onClick={() => {
                  setFormData({
                    displayName: module.displayName || '',
                    description: module.description || '',
                    evaluationCriteria: module.evaluationCriteria || '',
                    isActive: module.isActive ?? true,
                    initialRating: String(module.glickoConfig?.rating || 1500),
                    ratingDeviation: String(module.glickoConfig?.rd || 350),
                  });
                  setIsEditing(true);
                }}
              >
                <Settings className="mr-2 h-4 w-4" />
                {t('common.utils.edit')}
              </Button>
            )}
          </div>
        </div>

        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              {t('evaluation.edit.basic-info')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="displayName">{t('evaluation.edit.display-name')}</Label>
              <Input
                id="displayName"
                value={isEditing ? formData.displayName : module.displayName || ''}
                onChange={(value) => {
                  setFormData((prev) => ({ ...prev, displayName: value }));
                }}
                disabled={!isEditing || isSaving}
                placeholder={t('evaluation.edit.display-name-placeholder')}
                className={isEditing && !(formData.displayName || '').trim() ? 'border-red-500' : ''}
              />
              {isEditing && !(formData.displayName || '').trim() && (
                <p className="text-sm text-red-500">{t('common.input.required')}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">{t('evaluation.edit.description')}</Label>
              <Textarea
                id="description"
                value={isEditing ? formData.description : module.description || ''}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, description: e.target.value }));
                }}
                disabled={!isEditing || isSaving}
                placeholder={t('evaluation.edit.description-placeholder')}
                rows={3}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="evaluationCriteria">{t('evaluation.edit.evaluation-criteria')}</Label>
              <Textarea
                id="evaluationCriteria"
                value={isEditing ? formData.evaluationCriteria : module.evaluationCriteria || ''}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, evaluationCriteria: e.target.value }));
                }}
                disabled={!isEditing || isSaving}
                placeholder={t('evaluation.edit.criteria-placeholder')}
                rows={4}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>{t('evaluation.edit.status')}</Label>
                <div className="text-sm text-muted-foreground">{t('evaluation.edit.status-description')}</div>
              </div>
              <Switch
                checked={isEditing ? formData.isActive : module.isActive ?? true}
                onCheckedChange={(checked) => {
                  setFormData((prev) => ({ ...prev, isActive: checked }));
                }}
                disabled={!isEditing || isSaving}
              />
            </div>
          </CardContent>
        </Card>

        {/* Participants */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {t('evaluation.edit.participants')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{t('evaluation.edit.participant-count')}</div>
                  <div className="text-sm text-muted-foreground">
                    {module.participantAssetIds?.length || 0} {t('evaluation.participants')}
                  </div>
                </div>
                <Button
                  variant="outline"
                  disabled={!isEditing || isSaving}
                  onClick={() => setParticipantDialogOpen(true)}
                >
                  {t('evaluation.edit.manage-participants')}
                </Button>
              </div>
              <Separator />
              <div className="space-y-2">
                {module.participantAssetIds?.slice(0, 3).map((id, index) => (
                  <div key={id} className="flex items-center gap-3 rounded-lg border p-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-medium">
                      #{index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">Participant {id.slice(-6)}</div>
                      <div className="text-sm text-muted-foreground">{t('evaluation.participant.status.active')}</div>
                    </div>
                    <Badge variant="outline">{t('evaluation.participant.status.active')}</Badge>
                  </div>
                )) ?? (
                  <div className="py-8 text-center text-muted-foreground">
                    <Users className="mx-auto mb-2 h-8 w-8" />
                    <p>{t('evaluation.edit.no-participants')}</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Evaluators */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                评测员管理
              </div>
              <Button variant="outline" disabled={!isEditing || isSaving} onClick={() => setEvaluatorDialogOpen(true)}>
                添加评测员
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {evaluators?.data?.length ? (
                evaluators.data.map((evaluator) => (
                  <div key={evaluator.id} className="flex items-center gap-3 rounded-lg border p-2">
                    <div className="flex-1">
                      <div className="font-medium">{evaluator.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {evaluator.type === 'llm' ? `模型: ${evaluator.llmModelName}` : '人工评测员'}
                      </div>
                    </div>
                    <Badge variant={evaluator.type === 'llm' ? 'default' : 'secondary'}>{evaluator.type}</Badge>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  <Users className="mx-auto mb-2 h-8 w-8" />
                  <p>暂无关联的评测员</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* ELO Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              {t('evaluation.edit.elo-config')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>{t('evaluation.edit.initial-rating')}</Label>
                  <Input
                    type="number"
                    value={isEditing ? formData.initialRating : String(module.glickoConfig?.rating || 1500)}
                    onChange={(value) => {
                      setFormData((prev) => ({ ...prev, initialRating: value }));
                    }}
                    disabled={!isEditing || isSaving}
                    placeholder="1500"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>{t('evaluation.edit.rating-deviation')}</Label>
                  <Input
                    type="number"
                    value={isEditing ? formData.ratingDeviation : String(module.glickoConfig?.rd || 350)}
                    onChange={(value) => {
                      setFormData((prev) => ({ ...prev, ratingDeviation: value }));
                    }}
                    disabled={!isEditing || isSaving}
                    placeholder="350"
                  />
                </div>
              </div>
              <div className="text-sm text-muted-foreground">{t('evaluation.edit.elo-description')}</div>
            </div>
          </CardContent>
        </Card>

        {/* 参与者管理对话框 */}
        <Dialog open={participantDialogOpen} onOpenChange={setParticipantDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>添加参与者</DialogTitle>
              <DialogDescription>请输入要添加的参与者资产ID，多个ID用逗号分隔</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="participantIds">参与者资产ID</Label>
                <Textarea
                  id="participantIds"
                  value={newParticipantIds}
                  onChange={(e) => {
                    setNewParticipantIds(e.target.value);
                  }}
                  placeholder="输入资产ID，多个ID用逗号分隔，例如：asset1, asset2, asset3"
                  rows={3}
                  disabled={isAddingParticipants}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setParticipantDialogOpen(false);
                  setNewParticipantIds('');
                }}
                disabled={isAddingParticipants}
              >
                取消
              </Button>
              <Button onClick={handleAddParticipants} disabled={isAddingParticipants || !newParticipantIds.trim()}>
                {isAddingParticipants ? '添加中...' : '添加参与者'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* 评测员管理对话框 */}
        <Dialog open={evaluatorDialogOpen} onOpenChange={setEvaluatorDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>添加LLM评测员</DialogTitle>
              <DialogDescription>创建一个新的LLM评测员并将其关联到当前模块</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="evaluatorName">评测员名称</Label>
                <Input
                  id="evaluatorName"
                  value={newEvaluator.name}
                  onChange={(value) => setNewEvaluator((prev) => ({ ...prev, name: value }))}
                  placeholder="例如：GPT-4 Vision 评测员"
                  disabled={isAddingEvaluator}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="llmModelName">LLM 模型名称</Label>
                <Input
                  id="llmModelName"
                  value={newEvaluator.llmModelName}
                  onChange={(value) => setNewEvaluator((prev) => ({ ...prev, llmModelName: value }))}
                  placeholder="例如：llm:gpt-4-vision-preview"
                  disabled={isAddingEvaluator}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="evaluationFocus">评测焦点（可选）</Label>
                <Textarea
                  id="evaluationFocus"
                  value={newEvaluator.evaluationFocus}
                  onChange={(e) => setNewEvaluator((prev) => ({ ...prev, evaluationFocus: e.target.value }))}
                  placeholder="例如：图像质量和美学效果"
                  rows={3}
                  disabled={isAddingEvaluator}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setEvaluatorDialogOpen(false);
                  setNewEvaluator({ name: '', llmModelName: '', evaluationFocus: '' });
                }}
                disabled={isAddingEvaluator}
              >
                取消
              </Button>
              <Button
                onClick={handleCreateAndAddEvaluator}
                disabled={isAddingEvaluator || !newEvaluator.name.trim() || !newEvaluator.llmModelName?.trim()}
              >
                {isAddingEvaluator ? '添加中...' : '创建并添加'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};
