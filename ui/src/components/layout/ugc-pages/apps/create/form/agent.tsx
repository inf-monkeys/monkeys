import React, { useState } from 'react';

import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { useCreateAgent } from '@/features/agent';
import { useVinesTeam } from '@/components/router/guard/team.tsx';
import { Button } from '@/components/ui/button';
import { DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export const AgentCreateForm: React.FC<{
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}> = ({ setOpen }) => {
  const { t } = useTranslation();
  const { teamId } = useVinesTeam();

  const [name, setName] = useState(t('common.utils.untitled') + t('common.type.agent'));
  const [description, setDescription] = useState('');
  const [instructions, setInstructions] = useState('');

  const { run: createAgent, loading: isCreating } = useCreateAgent(teamId!);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!teamId) {
      toast.warning(t('common.toast.loading'));
      return;
    }

    try {
      const agent = await createAgent({
        name,
        description: description || undefined,
        config: {
          model: 'gpt-4o', // Default model
          instructions: instructions || 'You are a helpful assistant.',
          temperature: 0.7,
          maxTokens: 4096,
        },
      });

      if (agent) {
        window.open(`/${teamId}/agents/${agent.id}`, '_blank');
        setOpen(false);
        toast.success(t('common.create.success'));
      }
    } catch (error) {
      console.error('Failed to create agent:', error);
      toast.error(t('common.create.error'));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-2 flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="name">{t('ugc-page.app.create.dialog.info.label')}</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t('ugc-page.app.create.dialog.info.placeholder')}
          required
          autoFocus
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="description">{t('ugc-page.app.create.dialog.description.label')}</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t('ugc-page.app.create.dialog.description.placeholder')}
          className="h-16 resize-none"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="instructions">指令</Label>
        <Textarea
          id="instructions"
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          placeholder="输入 Agent 的系统指令..."
          className="h-24 resize-none"
        />
      </div>

      <DialogFooter>
        <Button
          variant="outline"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setOpen(false);
          }}
        >
          {t('common.utils.cancel')}
        </Button>
        <Button variant="solid" type="submit" loading={isCreating}>
          {t('common.utils.create')}
        </Button>
      </DialogFooter>
    </form>
  );
};
