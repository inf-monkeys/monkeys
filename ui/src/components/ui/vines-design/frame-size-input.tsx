import { useBoardCanvasSizeStore } from '@/store/useCanvasSizeStore';

import { Input } from '../input';

export const FrameSizeInput: React.FC = () => {
  const { setBoardCanvasSize, width, height } = useBoardCanvasSizeStore();

  return (
    <div className="flex items-center gap-1">
      <Input
        type="number"
        value={width.toFixed(2)}
        onChange={(v) => setBoardCanvasSize(Number(v), height)}
        onFocus={(e) => {
          e.currentTarget.selectionEnd;
        }}
      />
      <span> * </span>
      <Input type="number" value={Number(height).toFixed(2)} onChange={(v) => setBoardCanvasSize(width, Number(v))} />
    </div>
  );
};
