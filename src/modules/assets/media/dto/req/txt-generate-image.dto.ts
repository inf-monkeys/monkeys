import * as Joiful from 'joiful';

export class TxtGenerateImageDto {
  @Joiful.string()
  text: string;

  @Joiful.string()
  jsonFileName?: string;
}
