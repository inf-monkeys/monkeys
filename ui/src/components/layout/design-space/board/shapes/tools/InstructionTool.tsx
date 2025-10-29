import { StateNode, TLEventHandlers, createShapeId } from 'tldraw';

export class InstructionTool extends StateNode {
  static override id = 'instruction';

  override onEnter = () => {
    this.editor.setCursor({ type: 'cross', rotation: 0 });
  };

  override onExit = () => {
    this.editor.setCursor({ type: 'default', rotation: 0 });
  };

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

