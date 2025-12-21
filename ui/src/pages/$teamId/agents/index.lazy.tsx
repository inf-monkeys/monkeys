/**
 * Agents 列表页面
 */

import { useState } from 'react';
import { createLazyFileRoute, useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { AgentList } from '@/features/agent/components/AgentList';
import { AgentConfig } from '@/features/agent/components/AgentConfig';
import { useCreateAgent, useDeleteAgent } from '@/features/agent/hooks/useAgent';
import type { CreateAgentDto } from '@/features/agent/types/agent.types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export function AgentsPage() {
  const { teamId } = Route.useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [agentName, setAgentName] = useState('');
  const [agentDescription, setAgentDescription] = useState('');

  const { run: createAgent, loading: creating } = useCreateAgent(teamId);

  const handleAgentSelect = (agentId: string) => {
    void navigate({
      to: '/$teamId/agents/$agentId',
      params: { teamId, agentId },
    });
  };

  const handleCreateAgent = async (config: any) => {
    if (!agentName) {
      toast.error('Please enter agent name');
      return;
    }

    const createData: CreateAgentDto = {
      name: agentName,
      description: agentDescription,
      config,
    };

    try {
      const agent = await createAgent(createData);
      toast.success('Agent created successfully');
      setCreateDialogOpen(false);
      setAgentName('');
      setAgentDescription('');
      // Navigate to new agent
      void navigate({
        to: '/$teamId/agents/$agentId',
        params: { teamId, agentId: agent.id },
      });
    } catch (error: any) {
      toast.error(error.message || 'Failed to create agent');
    }
  };

  return (
    <div className="container mx-auto p-6">
      <AgentList
        teamId={teamId}
        onAgentSelect={handleAgentSelect}
        onAgentCreate={() => setCreateDialogOpen(true)}
      />

      {/* Create Agent Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Agent</DialogTitle>
            <DialogDescription>
              Configure your new AI agent with a model and instructions.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Name */}
            <div className="space-y-2">
              <label className="block text-sm font-medium">Name</label>
              <input
                type="text"
                value={agentName}
                onChange={(e) => setAgentName(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2"
                placeholder="My Agent"
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="block text-sm font-medium">
                Description (optional)
              </label>
              <textarea
                value={agentDescription}
                onChange={(e) => setAgentDescription(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2"
                rows={3}
                placeholder="A helpful assistant that..."
              />
            </div>

            {/* Config */}
            <AgentConfig
              teamId={teamId}
              onSave={handleCreateAgent}
              onCancel={() => setCreateDialogOpen(false)}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export const Route = createLazyFileRoute('/$teamId/agents/')({
  component: AgentsPage,
});
