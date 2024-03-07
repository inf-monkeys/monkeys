import { Test, TestingModule } from '@nestjs/testing';
import { ToolsPollingService } from './tools.polling.service';

describe('WorkerService', () => {
  let service: ToolsPollingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ToolsPollingService],
    }).compile();

    service = module.get<ToolsPollingService>(ToolsPollingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
