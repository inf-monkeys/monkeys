import { ApiProperty } from '@nestjs/swagger';

export class RemoveAssetTags {
  @ApiProperty({
    required: true,
    isArray: true,
    type: String,
  })
  tagIds: string[];
}
