import { ModelTrainingEntity } from '@/database/entities/model-training/model-training';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ModelTrainingController } from './model-training.controller';
import { ModelTrainingService } from './model-training.service';

export { ModelTrainingService } from './model-training.service';

@Module({
  imports: [TypeOrmModule.forFeature([ModelTrainingEntity])],
  controllers: [ModelTrainingController],
  providers: [ModelTrainingService],
})
export class ModelTrainingModule {}
