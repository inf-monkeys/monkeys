import { TLBaseShape, TLDefaultColorStyle } from 'tldraw';

export type InstructionShape = TLBaseShape<
  'instruction',
  {
    w: number;
    h: number;
    content: string;
    color: TLDefaultColorStyle;
    isRunning: boolean;
    connections: string[]; // 连接到的 output shape ids
  }
>;

export type OutputShape = TLBaseShape<
  'output',
  {
    w: number;
    h: number;
    content: string;
    imageUrl: string;
    color: TLDefaultColorStyle;
    sourceId: string; // 来源的 instruction shape id
  }
>;

