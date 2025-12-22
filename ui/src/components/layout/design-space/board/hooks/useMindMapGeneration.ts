import { useState, useCallback } from 'react';
import { Editor } from 'tldraw';
import { useVinesTeam } from '@/components/router/guard/team';
import { useUser } from '@/apis/authz/user';
import type { MindMapResult } from '../MindMapPanel';
import { applyMindMapToCanvas } from '../mind-map-utils';

interface UseMindMapGenerationOptions {
  editor: Editor | null;
}

export function useMindMapGeneration({ editor }: UseMindMapGenerationOptions) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MindMapResult | null>(null);
  const [aiInsight, setAiInsight] = useState<string>('');
  const [isGeneratingInsight, setIsGeneratingInsight] = useState(false);
  const [currentInsightType, setCurrentInsightType] = useState<'solution' | 'creativity' | 'relationship' | null>(null);
  const { team } = useVinesTeam();
  const { data: user } = useUser();

  const generateMindMap = useCallback(
    async (selectedShapes: any[]) => {
      if (!editor || !team?.id || !user?.id) {
        console.error('缺少必要的数据用于生成思维图谱');
        return;
      }

      if (selectedShapes.length < 2) {
        console.warn('至少需要选择2个图形才能生成思维图谱');
        return;
      }

      setLoading(true);

      try {
        const response = await fetch('/api/agents/canvas/generate-mind-map', {
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
          throw new Error(data.message || '生成思维图谱失败');
        }
      } catch (error) {
        console.error('生成思维图谱失败:', error);
        alert(`生成思维图谱失败: ${error instanceof Error ? error.message : '未知错误'}`);
      } finally {
        setLoading(false);
      }
    },
    [editor, team, user],
  );

  const applyToCanvas = useCallback(
    (result: MindMapResult) => {
      if (!editor) return;

      try {
        applyMindMapToCanvas(editor, result);
        // 应用成功后不关闭面板，保持编辑状态
      } catch (error) {
        console.error('应用思维图谱到画布失败:', error);
        alert(`应用到画布失败: ${error instanceof Error ? error.message : '未知错误'}`);
      }
    },
    [editor],
  );

  const closeResult = useCallback(() => {
    setResult(null);
  }, []);

  const updateNode = useCallback((nodeId: string, updates: Partial<any>) => {
    setResult((prev) => {
      if (!prev) return null;

      return {
        ...prev,
        nodes: prev.nodes.map((node) =>
          node.id === nodeId ? { ...node, ...updates } : node
        ),
      };
    });
  }, []);

  const addNode = useCallback((node: any) => {
    setResult((prev) => {
      if (!prev) return null;

      return {
        ...prev,
        nodes: [...prev.nodes, node],
      };
    });
  }, []);

  const deleteNode = useCallback((nodeId: string) => {
    setResult((prev) => {
      if (!prev) return null;

      return {
        ...prev,
        nodes: prev.nodes.filter((node) => node.id !== nodeId),
        edges: prev.edges.filter((edge) => edge.from !== nodeId && edge.to !== nodeId),
      };
    });
  }, []);

  const addEdge = useCallback((edge: any) => {
    setResult((prev) => {
      if (!prev) return null;

      return {
        ...prev,
        edges: [...prev.edges, edge],
      };
    });
  }, []);

  const deleteEdge = useCallback((edgeId: string) => {
    setResult((prev) => {
      if (!prev) return null;

      return {
        ...prev,
        edges: prev.edges.filter((edge) => edge.id !== edgeId),
      };
    });
  }, []);

  const generateInsight = useCallback(
    async (insightType: 'solution' | 'creativity' | 'relationship') => {
      if (!result || !team?.id || !user?.id) {
        console.error('缺少必要的数据用于生成洞察');
        return;
      }

      setIsGeneratingInsight(true);
      setCurrentInsightType(insightType);
      setAiInsight(''); // 清空之前的内容

      try {
        const response = await fetch('/api/agents/canvas/mind-map-insight', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            teamId: team.id,
            userId: user.id,
            insightType,
            nodes: result.nodes,
            edges: result.edges,
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        if ((data.code === 200 || data.code === 0) && data.data) {
          setAiInsight(data.data.insight);
        } else {
          throw new Error(data.message || '生成洞察失败');
        }
      } catch (error) {
        console.error('生成洞察失败:', error);
        alert(`生成洞察失败: ${error instanceof Error ? error.message : '未知错误'}`);
      } finally {
        setIsGeneratingInsight(false);
        setCurrentInsightType(null);
      }
    },
    [result, team, user],
  );

  return {
    loading,
    result,
    aiInsight,
    isGeneratingInsight,
    currentInsightType,
    generateMindMap,
    applyToCanvas,
    closeResult,
    updateNode,
    addNode,
    deleteNode,
    addEdge,
    deleteEdge,
    generateInsight,
  };
}
