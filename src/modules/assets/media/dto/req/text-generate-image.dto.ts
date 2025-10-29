import * as Joiful from 'joiful';

export class TextGenerateImageDto {
  @Joiful.string()
  text: string;

  @Joiful.string()
  jsonFileName?: string;
}
