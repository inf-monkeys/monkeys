import { createShapeId, StateNode, TLEventHandlers } from 'tldraw';

import { InstructionInputMode } from '../instruction/InstructionShape.types';

export class InstructionTool extends StateNode {
  static override id = 'instruction';

  // 存储输入模式
  private inputMode: InstructionInputMode = 'text';

  override onEnter = () => {
    this.editor.setCursor({ type: 'cross', rotation: 0 });
  };

  override onExit = () => {
    this.editor.setCursor({ type: 'default', rotation: 0 });
  };

  // 设置输入模式（从工具栏调用）
  setInputMode(mode: InstructionInputMode) {
    this.inputMode = mode;
  }

  override onPointerDown: TLEventHandlers['onPointerDown'] = (info) => {
    const point = this.editor.inputs.currentPagePoint;

    // 创建一个新的 Instruction shape
    const id = createShapeId();
    this.editor.createShape({
      id,
      type: 'instruction',
      x: point.x,
      y: point.y,
      props: {
        w: 300,
        h: 200,
        content: '',
        imageUrl: '',
        inputMode: this.inputMode,
        color: 'blue',
        isRunning: false,
        connections: [],
      },
    } as any);

    // 选中新创建的 shape
    this.editor.select(id);

    // 切回选择工具
    this.editor.setCurrentTool('select');
  };
}

export class OutputTool extends StateNode {
  static override id = 'output';

  override onEnter = () => {
    this.editor.setCursor({ type: 'cross', rotation: 0 });
  };

  override onExit = () => {
    this.editor.setCursor({ type: 'default', rotation: 0 });
  };

  override onPointerDown: TLEventHandlers['onPointerDown'] = (info) => {
    const point = this.editor.inputs.currentPagePoint;

    // 创建一个新的 Output shape
    const id = createShapeId();
    this.editor.createShape({
      id,
      type: 'output',
      x: point.x,
      y: point.y,
      props: {
        w: 300,
        h: 200,
        content: '',
        color: 'green',
        sourceId: '',
        imageUrl: '',
      },
    } as any);

    // 选中新创建的 shape
    this.editor.select(id);

    // 切回选择工具
    this.editor.setCurrentTool('select');
  };
}
