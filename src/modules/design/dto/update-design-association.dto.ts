import { PartialType } from '@nestjs/swagger';
import { CreateDesignAssociationDto } from './create-design-association.dto';

export class UpdateDesignAssociationDto extends PartialType(CreateDesignAssociationDto) {}
