import { useState, useCallback } from 'react';
import { Editor } from 'tldraw';
import { useVinesTeam } from '@/components/router/guard/team';
import { useUser } from '@/apis/authz/user';
import type { RelationshipDiscoveryResult } from '../RelationshipResultPanel';
import { applyRelationshipsToCanvas } from '../relationship-utils';

interface UseRelationshipDiscoveryOptions {
  editor: Editor | null;
}

export function useRelationshipDiscovery({ editor }: UseRelationshipDiscoveryOptions) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RelationshipDiscoveryResult | null>(null);
  const { team } = useVinesTeam();
  const { data: user } = useUser();

  const discoverRelationships = useCallback(
    async (selectedShapes: any[]) => {
      if (!editor || !team?.id || !user?.id) {
        console.error('Missing required data for relationship discovery');
        return;
      }

      if (selectedShapes.length < 2) {
        console.warn('At least 2 shapes are required for relationship discovery');
        return;
      }

      setLoading(true);

      try {
        const response = await fetch('/api/agents/canvas/discover-relationships', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            teamId: team.id,
            userId: user.id,
            shapes: selectedShapes,
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        if ((data.code === 200 || data.code === 0) && data.data) {
          setResult(data.data);
        } else {
          throw new Error(data.message || 'Failed to discover relationships');
        }
      } catch (error) {
        console.error('Failed to discover relationships:', error);
        alert(`关系发现失败: ${error instanceof Error ? error.message : '未知错误'}`);
      } finally {
        setLoading(false);
      }
    },
    [editor, team, user],
  );

  const applyToCanvas = useCallback(
    (result: RelationshipDiscoveryResult) => {
      if (!editor) return;

      try {
        applyRelationshipsToCanvas(editor, result);
        // 应用成功后静默关闭面板，不显示提示
        setResult(null);
      } catch (error) {
        console.error('Failed to apply relationships to canvas:', error);
        // 只在出错时显示提示
        alert(`应用到画布失败: ${error instanceof Error ? error.message : '未知错误'}`);
      }
    },
    [editor],
  );

  const closeResult = useCallback(() => {
    setResult(null);
  }, []);

  return {
    loading,
    result,
    discoverRelationships,
    applyToCanvas,
    closeResult,
  };
}
