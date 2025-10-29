import * as Joiful from 'joiful';

export class TxtGenerate3DModelDto {
  @Joiful.string()
  text: string;

  @Joiful.string()
  jsonFileName?: string;
}
