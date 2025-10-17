import { IsBoolean } from 'class-validator';

export class TogglePinMediaDto {
  @IsBoolean()
  pinned: boolean;
}

