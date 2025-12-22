import React, { useEffect, useState } from 'react';

import { mutate } from 'swr';

import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { agentApi } from '@/features/agent/api/agent-api';
import type { Agent } from '@/features/agent/types/agent.types';
import { IAssetItem } from '@/apis/ugc/typings.ts';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label.tsx';
import { Textarea } from '@/components/ui/textarea.tsx';

interface IAgentInfoEditorProps {
  agent: IAssetItem<Agent>;
  visible: boolean;
  setVisible: (visible: boolean) => void;
}

export const AgentInfoEditor: React.FC<IAgentInfoEditorProps> = ({ agent, visible, setVisible }) => {
  const { t } = useTranslation();

  const [name, setName] = useState(agent.name);
  const [description, setDescription] = useState(agent.description || '');

  useEffect(() => {
    if (visible) {
      setName(agent.name);
      setDescription(agent.description || '');
    }
  }, [visible, agent]);

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error(t('ugc-page.agents.ugc-view.operate-area.agent-info-editor.name-required'));
      return;
    }

    try {
      await agentApi.updateAgent(agent.id, agent.teamId!, {
        name: name.trim(),
        description: description.trim() || undefined,
      });

      toast.success(t('common.update.success'));
      void mutate((key) => typeof key === 'string' && key.startsWith('/api/agents'));
      setVisible(false);
    } catch (error: any) {
      toast.error(error.message || t('common.update.error'));
    }
  };

  return (
    <Dialog open={visible} onOpenChange={setVisible}>
      <DialogContent
        className="sm:max-w-[525px]"
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle>{t('ugc-page.agents.ugc-view.operate-area.agent-info-editor.title')}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="agent-name">{t('ugc-page.agents.ugc-view.operate-area.agent-info-editor.name')}</Label>
            <Input
              id="agent-name"
              value={name}
              onChange={(value) => setName(value)}
              placeholder={t('ugc-page.agents.ugc-view.operate-area.agent-info-editor.name-placeholder')}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="agent-description">
              {t('ugc-page.agents.ugc-view.operate-area.agent-info-editor.description')}
            </Label>
            <Textarea
              id="agent-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('ugc-page.agents.ugc-view.operate-area.agent-info-editor.description-placeholder')}
              rows={4}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setVisible(false)}>
            {t('common.utils.cancel')}
          </Button>
          <Button onClick={handleSave}>{t('common.utils.save')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
