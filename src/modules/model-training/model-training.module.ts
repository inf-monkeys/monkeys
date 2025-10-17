import { ModelTrainingEntity } from '@/database/entities/model-training/model-training';
import { ModelTrainingConfigEntity } from '@/database/entities/model-training/model-training-config';
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ModelTrainingController } from './model-training.controller';
import { ModelTrainingService } from './model-training.service';

export { ModelTrainingService } from './model-training.service';

@Module({
  imports: [TypeOrmModule.forFeature([ModelTrainingEntity, ModelTrainingConfigEntity]), HttpModule],
  controllers: [ModelTrainingController],
  providers: [ModelTrainingService],
})
export class ModelTrainingModule {}
