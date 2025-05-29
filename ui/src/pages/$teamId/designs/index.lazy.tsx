import React, { useState } from 'react';

import { createLazyFileRoute } from '@tanstack/react-router';

import { useTranslation } from 'react-i18next';
import { createShapeId, Editor, getSnapshot, loadSnapshot, TLShapeId, toRichText } from 'tldraw';

import { Board } from '@/components/layout/design-space/board';
import { Button } from '@/components/ui/button';
import { FrameSizeInput } from '@/components/ui/vines-design/frame-size-input';
import { EditorContext } from '@/store/useBoardStore';
import { useBoardCanvasSizeStore } from '@/store/useCanvasSizeStore';
import { cn } from '@/utils';

const Card: React.FC<{
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
}> = ({ children, onClick, className }) => {
  return (
    <div
      className={cn(
        'flex cursor-pointer items-center justify-center rounded-md bg-gray-100 p-4 hover:bg-gray-200',
        className,
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
};
const FontCard: React.FC<{
  label: string;
  family: string;
  onClick: () => void;
}> = ({ label, family, onClick }) => {
  return (
    <Card onClick={onClick}>
      <span style={{ fontFamily: `tldraw_${family}` }}>{label}</span>
    </Card>
  );
};

const CanvasSizeControl: React.FC = () => {
  const { width, height, setBoardCanvasSize } = useBoardCanvasSizeStore();

  return (
    <Card className="col-span-2 flex flex-col gap-2">
      <FrameSizeInput />
      <Button
        variant="outline"
        className="w-full"
        onClick={() => {
          setBoardCanvasSize(width, height);
        }}
      >
        Set & Zoom Fit
      </Button>
    </Card>
  );
};

const BoardContainer: React.FC<{
  editor: Editor | null;
  setEditor: React.Dispatch<React.SetStateAction<Editor | null>>;
  frameShapeId: TLShapeId;
}> = ({ editor, setEditor, frameShapeId }) => {
  const { width, height } = useBoardCanvasSizeStore();

  return (
    <Board
      editor={editor}
      setEditor={setEditor}
      canvasWidth={width}
      canvasHeight={height}
      instance={{ frameShapeId }}
    />
  );
};

export const Designs: React.FC = () => {
  const { t } = useTranslation();

  const [editor, setEditor] = useState<Editor | null>(null);

  const [frameShapeId, setFrameShapeId] = useState<TLShapeId>(createShapeId());

  // const { width, height, setBoardCanvasSize } = useBoardCanvasSizeStore();

  let y = 0;

  const handleInsertShape = () => {
    editor?.createShape({
      type: 'text',
      props: {
        richText: toRichText('ok'),
        font: 'draw',
      },
    });
  };

  const handleInsertFont = (font: string) => {
    editor?.createShape({
      type: 'text',
      props: {
        richText: toRichText(font),
        font,
      },
      y,
    });
    y += 32;
  };

  const downloadFile = (file: File) => {
    const link = document.createElement('a');
    const url = URL.createObjectURL(file);
    link.href = url;
    link.download = file.name;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExport = async () => {
    if (!editor) return;
    const ids = [frameShapeId];
    const { blob } = await editor.toImage(ids, { format: 'png' });
    const file = new File([blob], `design-board-${Date.now()}.png`, { type: blob.type });
    downloadFile(file);
  };

  const handleSave = () => {
    if (!editor) return;
    const { document, session } = getSnapshot(editor.store);
    localStorage.setItem('design-snapshot', JSON.stringify({ document, session }));
  };

  const handleLoad = () => {
    if (!editor) return;
    const snapshot = JSON.parse(localStorage.getItem('design-snapshot') || '{}');
    loadSnapshot(editor.store, snapshot);
  };

  return (
    <main className="size-full">
      <EditorContext.Provider value={{ editor }}>
        <div className="flex h-full w-full gap-2">
          <div className="flex w-64 flex-col gap-2">
            <div className="grid grid-cols-2 gap-2">
              <FontCard label="Draw" family="draw" onClick={() => handleInsertFont('draw')} />
              <FontCard label="Mono" family="mono" onClick={() => handleInsertFont('mono')} />
              <FontCard label="Sans" family="sans" onClick={() => handleInsertFont('sans')} />
              <FontCard label="Serif" family="serif" onClick={() => handleInsertFont('serif')} />
              <Card onClick={handleInsertShape}>
                <span>Insert</span>
              </Card>
              <Card onClick={handleExport}>
                <span>Export</span>
              </Card>
              <CanvasSizeControl />
              <Card onClick={handleSave}>
                <span>Save</span>
              </Card>
              <Card onClick={handleLoad}>
                <span>Load</span>
              </Card>
            </div>
          </div>
          <div className="h-full w-full flex-1">
            <BoardContainer editor={editor} setEditor={setEditor} frameShapeId={frameShapeId} />
          </div>
        </div>
      </EditorContext.Provider>
    </main>
  );
};

export const Route = createLazyFileRoute('/$teamId/designs/')({
  component: Designs,
});

// const useSaveSnapShot = () => {
//   const { teamId } = useParams<{ teamId: string }>();
//   const { saveSnapshot } = useBoardStore();
//   const { mutateAsync: saveDesign } = useMutation({
//     mutationFn: (snapshot: Record<string, any>) =>
//       saveDesignMutation({
//         teamId,
//         snapshot,
//       }),
//   });
//   return { saveSnapshot, saveDesign };
// };

// const loadSnapShot = () => {};
