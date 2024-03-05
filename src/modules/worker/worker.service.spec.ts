import { Test, TestingModule } from '@nestjs/testing';
import { WorkerPollingService } from './worker.polling.service';

describe('WorkerService', () => {
  let service: WorkerPollingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WorkerPollingService],
    }).compile();

    service = module.get<WorkerPollingService>(WorkerPollingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
