import React, { useState } from 'react';

import { createLazyFileRoute } from '@tanstack/react-router';

import { useTranslation } from 'react-i18next';
import { Editor, toRichText } from 'tldraw';

import { Board } from '@/components/layout/design-space/board';
import { EditorContext } from '@/store/useBoardStore';

const FontCard: React.FC<{
  label: string;
  family: string;
  onClick: () => void;
}> = ({ label, family, onClick }) => {
  return (
    <div
      className="flex cursor-pointer items-center justify-center rounded-md bg-gray-100 p-4 hover:bg-gray-200"
      onClick={onClick}
      style={{ fontFamily: `tldraw_${family}` }}
    >
      <span>{label}</span>
    </div>
  );
};

export const Designs: React.FC = () => {
  const { t } = useTranslation();

  const [editor, setEditor] = useState<Editor | null>(null);

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

  return (
    <main className="size-full">
      <EditorContext.Provider value={{ editor }}>
        <div className="flex h-full w-full gap-2">
          <div className="w-64">
            <div className="grid grid-cols-2 gap-2">
              <FontCard label="Draw" family="draw" onClick={() => handleInsertFont('draw')} />
              <FontCard label="Mono" family="mono" onClick={() => handleInsertFont('mono')} />
              <FontCard label="Sans" family="sans" onClick={() => handleInsertFont('sans')} />
              <FontCard label="Serif" family="serif" onClick={() => handleInsertFont('serif')} />
            </div>
            {/* <Button variant="outline" onClick={handleInsertShape}>
              Insert Shape
            </Button> */}
          </div>
          <div className="h-full w-full flex-1">
            <Board editor={editor} setEditor={setEditor} />
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
