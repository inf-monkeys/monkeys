import { FileWithPath } from 'react-dropzone';

export type IPointerMode = 'brush' | 'eraser' | 'move';

export interface FileWithPathWritable extends FileWithPath {
  path?: string;
}
