import { Module } from '@nestjs/common';
import { ExampleToolsController } from './example.controller';

@Module({
  controllers: [ExampleToolsController],
})
export class ExampleToolsModule {}
