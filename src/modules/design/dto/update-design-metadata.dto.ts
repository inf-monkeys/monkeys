import { PartialType } from '@nestjs/swagger';
import { CreateDesignMetadataDto } from './create-design-metadata.dto';

export class UpdateDesignMetadataDto extends PartialType(CreateDesignMetadataDto) {}
