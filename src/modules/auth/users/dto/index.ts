import * as Joiful from 'joiful';

export class UpdateUserProfileDto {
  @Joiful.string().optional()
  photo?: string;

  @Joiful.string().optional()
  name?: string;
}
