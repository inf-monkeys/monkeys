import { Module } from '@nestjs/common';
import { ExampleController } from './example.controller';

@Module({
  controllers: [ExampleController],
})
export class ExampleModule {}
