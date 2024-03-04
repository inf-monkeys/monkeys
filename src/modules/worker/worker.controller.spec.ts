import { Test, TestingModule } from '@nestjs/testing';
import { WorkerController } from './worker.controller';

describe('WorkerController', () => {
  let controller: WorkerController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WorkerController],
    }).compile();

    controller = module.get<WorkerController>(WorkerController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
