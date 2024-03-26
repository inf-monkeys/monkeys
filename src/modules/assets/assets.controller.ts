import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@Controller('assets')
@ApiTags('Assets')
export class AssetsController {}
