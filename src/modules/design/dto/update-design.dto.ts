import { PartialType } from '@nestjs/mapped-types';
import { CreateDesignDto } from './create-design.dto';

export class UpdateDesignDto extends PartialType(CreateDesignDto) {}
