import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BlockModule } from './modules/block/block.module';
import { DatabaseModule } from './modules/infra/database/database.module';
import { RepositoryMoule } from './modules/infra/database/repositories/repositories.module';
import { ToolsModule } from './modules/tools/tools.module';

@Module({
  imports: [DatabaseModule, ToolsModule, BlockModule, RepositoryMoule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
