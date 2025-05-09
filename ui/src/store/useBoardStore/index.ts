import { createContext } from 'react';

import { Editor } from 'tldraw';

export const EditorContext = createContext({} as { editor: Editor | null });
