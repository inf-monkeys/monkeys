import { FileWithPath } from '@mantine/dropzone';

export type IPointerMode = 'brush' | 'eraser' | 'move';

export interface FileWithPathWritable extends FileWithPath {
  path?: string;
}
