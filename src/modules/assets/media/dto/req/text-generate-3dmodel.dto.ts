import * as Joiful from 'joiful';

export class TextGenerate3DModelDto {
  @Joiful.string()
  text: string;

  @Joiful.string()
  jsonFileName?: string;
}
