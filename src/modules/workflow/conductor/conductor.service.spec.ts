import { Test, TestingModule } from '@nestjs/testing';
import { ConductorService } from './conductor.service';

describe('ConductorService', () => {
  let service: ConductorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ConductorService],
    }).compile();

    service = module.get<ConductorService>(ConductorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
