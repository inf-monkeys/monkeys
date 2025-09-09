import React, { useEffect, useState } from 'react';

import { useGetAgent } from '@/apis/agents';
import { useGetAgentV2 } from '@/apis/agents-v2';
import { VinesLoading } from '@/components/ui/loading';
import { useAgentStore } from '@/store/useAgentStore';
import { AgentV2ConfigView } from '@/view/agent-v2-config';

// Import the original config view
const AgentConfigViewLazy = React.lazy(() => import('./vines-agent-config-lazy.tsx'));

const SmartAgentConfigRouter: React.FC = () => {
  const agentId = useAgentStore((s) => s.agentId);
  const [agentType, setAgentType] = useState<'v1' | 'v2' | null>(null);
  const [loading, setLoading] = useState(true);

  const { data: agentV1Data, error: agentV1Error } = useGetAgent(agentId);
  const { data: agentV2Data, error: agentV2Error } = useGetAgentV2(agentId);

  useEffect(() => {
    // Determine which agent API responds successfully
    if (agentV2Data) {
      setAgentType('v2');
      setLoading(false);
    } else if (agentV1Data) {
      setAgentType('v1');
      setLoading(false);
    } else if (agentV1Error && agentV2Error) {
      // Both failed, default to v2 for new agents
      setAgentType('v2');
      setLoading(false);
    }
  }, [agentV1Data, agentV2Data, agentV1Error, agentV2Error]);

  // Add timeout fallback to prevent infinite loading
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading && !agentType) {
        setAgentType('v2');
        setLoading(false);
      }
    }, 5000); // 5 second timeout

    return () => clearTimeout(timeout);
  }, [loading, agentType]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <VinesLoading />
      </div>
    );
  }

  // Route to appropriate config view based on agent type
  if (agentType === 'v2') {
    return <AgentV2ConfigView />;
  }

  // Default to original agent config view
  return (
    <React.Suspense
      fallback={
        <div className="flex h-64 items-center justify-center">
          <VinesLoading />
        </div>
      }
    >
      <AgentConfigViewLazy />
    </React.Suspense>
  );
};

export default SmartAgentConfigRouter;
