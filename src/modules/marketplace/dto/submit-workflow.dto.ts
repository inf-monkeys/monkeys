import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class SubmitWorkflowToMarketplaceDto {
  @ApiProperty({
    description: 'The version of the workflow to submit.',
    required: true,
    type: Number,
  })
  @IsNumber()
  @IsNotEmpty()
  version: number;

  @ApiProperty({
    description: 'Release notes for this version.',
    required: false,
    type: String,
  })
  @IsString()
  @IsOptional()
  releaseNotes?: string;
}
