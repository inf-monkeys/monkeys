import { TenantStaticsAuthGuard } from '@/common/guards/tenant-statics.guard';
import { Controller, Get, HttpCode, Res, UseGuards } from '@nestjs/common';
import axios from 'axios';
import { Response } from 'express';
import { TenantService } from './tenant.service';

const BATCH_SIZE = 5000;

@Controller('tenant')
@UseGuards(TenantStaticsAuthGuard)
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  // @Post()
  // async create(@Body() createTenantDto: CreateTenantDto) {
  //   return await this.tenantService.create(createTenantDto);
  // }

  @Get()
  async findAll() {
    return await this.tenantService.findAll();
  }

  @Get('es')
  @HttpCode(200)
  async findAllEs(@Res() res: Response) {
    res.setHeader('content-type', 'text/event-stream');
    res.status(200);
    const searchQuery = {
      size: BATCH_SIZE, // Limit to 10 results
      from: 0, // Start from the beginning (skip 0 results)
      query: {
        match_all: {}, // Example query: fetch all documents
      },
      sort: [
        { startTime: 'asc' }, // Sort by start time descending for consistent pagination
      ],
    };
    while (true) {
      try {
        const result = await axios.post('http://elasticsearch-master:9200/conductor_workflow/_search?pretty', searchQuery, {
          headers: {
            'Content-Type': 'application/json',
          },
        });
        // Check for successful response
        if (result.status === 200) {
          res.write(result.data);
          if (result.data.length < BATCH_SIZE) {
            searchQuery.from += BATCH_SIZE;
            break;
          }
        } else {
          // Handle non-200 status codes
          res.write({ error: 'Unexpected response status', status: result.status });
          res.end();
          return;
        }
      } catch (error) {
        // Handle any network or other errors
        res.write(error);
        res.end();
      }
    }
    res.end();
  }
}
