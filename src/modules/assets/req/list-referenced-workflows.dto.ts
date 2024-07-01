import { AssetType } from '@inf-monkeys/monkeys';
import { ApiProperty } from '@nestjs/swagger';

export class ListReferencedWorkflowsDto {
  @ApiProperty({
    description: 'Asset Type',
    type: String,
    required: true,
  })
  assetType: AssetType;

  @ApiProperty({
    description: 'Asset Id',
    type: String,
    required: true,
  })
  assetId: string;
}
