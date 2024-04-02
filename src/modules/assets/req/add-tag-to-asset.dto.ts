import { ApiProperty } from '@nestjs/swagger';

export class AddTagToAssetDto {
  @ApiProperty({
    required: true,
    isArray: true,
    type: String,
  })
  tagIds: string[];
}
