import { Module } from '@nestjs/common';
import { BuiltinToolsController } from './builtin.controller';
import { BuiltinToolsService } from './builtin.service';

@Module({
  controllers: [BuiltinToolsController],
  providers: [BuiltinToolsService],
})
export class BuiltinToolsModule {}
