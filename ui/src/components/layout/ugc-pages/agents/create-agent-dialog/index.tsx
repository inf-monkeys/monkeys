import React, { useState } from 'react';

import { Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';
import { mutate } from 'swr';

import { agentApi } from '@/features/agent/api/agent-api';
import { AgentConfig } from '@/features/agent/components/AgentConfig';
import { useUser } from '@/apis/authz/user';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label.tsx';
import { Textarea } from '@/components/ui/textarea.tsx';
import { useGetUgcViewIconOnlyMode } from '@/components/layout/ugc-pages/util';

interface ICreateAgentDialogProps {
  teamId: string;
}

export const CreateAgentDialog: React.FC<ICreateAgentDialogProps> = ({ teamId }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: user } = useUser();
  const iconOnlyMode = useGetUgcViewIconOnlyMode();

  const [open, setOpen] = useState(false);
  const [agentName, setAgentName] = useState('');
  const [agentDescription, setAgentDescription] = useState('');

  const handleCreateAgent = async (config: any) => {
    if (!agentName.trim()) {
      toast.error(t('ugc-page.agents.create-dialog.name-required'));
      return;
    }

    if (!user?.id) {
      toast.error(t('common.toast.not-logged-in'));
      return;
    }

    try {
      const agent = await agentApi.createAgent(teamId, user.id, {
        name: agentName.trim(),
        description: agentDescription.trim() || undefined,
        config,
      });

      toast.success(t('common.create.success'));
      setOpen(false);
      setAgentName('');
      setAgentDescription('');

      // Refresh agents list
      void mutate((key) => typeof key === 'string' && key.startsWith('/api/agents'));

      // Navigate to new agent
      void navigate({
        to: '/$teamId/agents/$agentId',
        params: { teamId, agentId: agent.id },
      });
    } catch (error: any) {
      toast.error(error.message || t('common.create.error'));
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="solid" size="small" icon={<Plus />}>
          {iconOnlyMode ? null : t('common.utils.create')}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{t('ugc-page.agents.create-dialog.title')}</DialogTitle>
          <DialogDescription>{t('ugc-page.agents.create-dialog.description')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 overflow-y-auto pr-2">
          <div className="space-y-2">
            <Label htmlFor="agent-name">{t('ugc-page.agents.create-dialog.name')}</Label>
            <Input
              id="agent-name"
              value={agentName}
              onChange={(value) => setAgentName(value)}
              placeholder={t('ugc-page.agents.create-dialog.name-placeholder')}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="agent-description">{t('ugc-page.agents.create-dialog.description')}</Label>
            <Textarea
              id="agent-description"
              value={agentDescription}
              onChange={(e) => setAgentDescription(e.target.value)}
              placeholder={t('ugc-page.agents.create-dialog.description-placeholder')}
              rows={3}
            />
          </div>

          <AgentConfig
            teamId={teamId}
            onSave={handleCreateAgent}
            onCancel={() => setOpen(false)}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};
