import { Test, TestingModule } from '@nestjs/testing';
import { WorkerService } from './worker.service';

describe('WorkerService', () => {
  let service: WorkerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WorkerService],
    }).compile();

    service = module.get<WorkerService>(WorkerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
