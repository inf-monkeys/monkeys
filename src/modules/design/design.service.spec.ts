import { Test, TestingModule } from '@nestjs/testing';
import { DesignService } from './design.service';

describe('DesignService', () => {
  let service: DesignService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DesignService],
    }).compile();

    service = module.get<DesignService>(DesignService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
