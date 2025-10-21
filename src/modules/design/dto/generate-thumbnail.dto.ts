import { IsNotEmpty, IsString } from 'class-validator';

export class GenerateThumbnailDto {
  @IsString()
  @IsNotEmpty()
  imageData: string;
}