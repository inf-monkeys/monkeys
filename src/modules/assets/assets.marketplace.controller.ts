import { Controller } from '@nestjs/common';
import { AssetsMarketplaceService } from './assets.marketplace.service';

@Controller()
export class AssetsMarketplaceController {
  constructor(private readonly assetsMarketplacService: AssetsMarketplaceService) {}
}
