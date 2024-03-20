import { Test, TestingModule } from '@nestjs/testing';
import { ApikeyService } from './apikey.service';

describe('ApikeyService', () => {
  let service: ApikeyService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ApikeyService],
    }).compile();

    service = module.get<ApikeyService>(ApikeyService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
