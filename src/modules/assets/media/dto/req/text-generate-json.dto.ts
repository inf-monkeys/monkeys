import * as Joiful from 'joiful';

export class TextGenerateJsonDto {
  @Joiful.string()
  text: string;

  @Joiful.string()
  jsonFileName?: string;
}
