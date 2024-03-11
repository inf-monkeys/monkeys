import { Test, TestingModule } from '@nestjs/testing';
import { BuiltinToolsService } from './builtin.service';

describe('BuiltinService', () => {
  let service: BuiltinToolsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BuiltinToolsService],
    }).compile();

    service = module.get<BuiltinToolsService>(BuiltinToolsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
