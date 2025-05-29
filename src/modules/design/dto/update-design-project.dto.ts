import { PartialType } from '@nestjs/swagger';
import { CreateDesignProjectDto } from './create-design-project.dto';

export class UpdateDesignProjectDto extends PartialType(CreateDesignProjectDto) {}
