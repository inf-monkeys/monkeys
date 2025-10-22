import * as Joiful from 'joiful';

export class UpdateMediaDto {
  @Joiful.string().optional()
  iconUrl?: string;

  @Joiful.string().optional()
  displayName?: string;

  @Joiful.string().optional()
  description?: string;
}
