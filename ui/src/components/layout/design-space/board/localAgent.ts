import type { Editor } from 'tldraw';

export type AgentInput = {
  message: string;
  bounds?: { x: number; y: number; w: number; h: number };
  modelName?: string;
};

export type AgentMessage = {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
};

export class LocalTldrawAgent {
  private editor: Editor;
  public history: AgentMessage[] = [];

  constructor(editor: Editor) {
    this.editor = editor;
  }

  reset() {
    this.history = [];
  }

  cancel() {
    // 本地实现无长任务，预留
  }

  async request(input: AgentInput) {
    return this.prompt(input);
  }

  async prompt(input: string | AgentInput) {
    const normalized: AgentInput = typeof input === 'string' ? { message: input } : input;
    const { message } = normalized;
    this.history.push({ role: 'user', content: message, timestamp: Date.now() });

    const result = await this.executeInstruction(message, normalized.bounds);
    this.history.push({ role: 'assistant', content: result, timestamp: Date.now() });
    return result;
  }

  private async executeInstruction(text: string, bounds?: AgentInput['bounds']) {
    const t = text.trim().toLowerCase();
    try {
      if (t.includes('矩形') || t.includes('rectangle')) {
        const x = bounds?.x ?? 100;
        const y = bounds?.y ?? 100;
        const w = bounds?.w ?? 200;
        const h = bounds?.h ?? 120;
        this.editor.createShape({ type: 'geo', x, y, props: { geo: 'rectangle', w, h } as any });
        return '已创建矩形';
      }
      if (t.includes('圆') || t.includes('ellipse') || t.includes('circle')) {
        const x = bounds?.x ?? 160;
        const y = bounds?.y ?? 160;
        const w = bounds?.w ?? 160;
        const h = bounds?.h ?? 160;
        this.editor.createShape({ type: 'geo', x, y, props: { geo: 'ellipse', w, h } as any });
        return '已创建圆形';
      }
      if (t.includes('箭头') || t.includes('arrow')) {
        const x = bounds?.x ?? 120;
        const y = bounds?.y ?? 120;
        const x2 = x + (bounds?.w ?? 180);
        const y2 = y + (bounds?.h ?? 60);
        this.editor.createShape({ type: 'arrow', x, y, props: { start: { x: 0, y: 0 }, end: { x: x2 - x, y: y2 - y } } as any });
        return '已创建箭头';
      }
      if (t.includes('删除选中') || t.includes('delete selection')) {
        const ids = this.editor.getSelectedShapeIds();
        this.editor.deleteShapes(ids as any);
        return `已删除 ${ids.length} 个形状`;
      }
      if (t.includes('选中全部') || t.includes('select all')) {
        this.editor.selectAll();
        return '已选中全部';
      }
      if (t.includes('居中') || t.includes('center')) {
        const boundsNow = (this.editor as any).getSelectionPageBounds?.();
        if (boundsNow) (this.editor as any).zoomToBounds?.(boundsNow, { inset: 64 });
        else (this.editor as any).zoomToFit?.();
        return '已居中视图';
      }
      return '未识别的指令（示例：画一个矩形/圆/箭头、删除选中、选中全部、视图居中）';
    } catch (e) {
      return '执行失败';
    }
  }
}



