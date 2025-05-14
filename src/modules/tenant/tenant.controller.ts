import { TenantStaticsAuthGuard } from '@/common/guards/tenant-statics.guard';
import { SuccessResponse } from '@/common/response';
import { Controller, Get, HttpCode, Query, UseGuards } from '@nestjs/common';
import { TenantService } from './tenant.service';

const BATCH_SIZE = 1000;

@Controller('tenant')
@UseGuards(TenantStaticsAuthGuard)
export class TenantController {
  constructor(
    private readonly tenantService: TenantService,
  ) { }

  // @Post()
  // async create(@Body() createTenantDto: CreateTenantDto) {
  //   return await this.tenantService.create(createTenantDto);
  // }

  @Get()
  async findAll() {
    const result = await this.tenantService.findAll();
    return new SuccessResponse({
      data: result,
    });
  }

  @Get('es')
  @HttpCode(200)
  async findAllEs(@Query() from: number, @Query() size?: number) {
    // const searchQuery = {
    //   size: size || BATCH_SIZE, // Limit to 10 results
    //   from: from || 0, // Start from the beginning (skip 0 results)
    //   query: {
    //     match_all: {}, // Example query: fetch all documents
    //   },
    //   sort: [
    //     { startTime: 'asc' }, // Sort by start time descending for consistent pagination
    //   ],
    // };
    // try {
    //   const result = await axios.post('http://10.93.0.110:9200/conductor_workflow/_search?pretty', searchQuery, {
    //     headers: {
    //       'Content-Type': 'application/json',
    //     },
    //   });
    //   if (result.status === 200) {
    //     const data = result.data;
    //     const hits: Record<string, any> = data.hits.hits!;
    //     const finalResult = [];
    //     hits.forEach((e) => {
    //       try {
    //         const output = JSON.parse(e.output);
    //         if (output.success) {
    //           finalResult.push(output);
    //         }
    //       } catch (e) { }
    //     });
    //     return finalResult;
    //   } else {
    //     // Handle non-200 status codes
    //     return { error: 'Unexpected response status', status: result.status };
    //   }
    // } catch (error) {
    //   // Handle any network or other errors
    //   return error;
    // }

    const result = await this.tenantService.findAllEs();
    return new SuccessResponse({
      data: result,
    });
  }
}
