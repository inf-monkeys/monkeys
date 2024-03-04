import { PORT } from '@/common/config';
import { BlockDefinition, BlockType } from '@inf-monkeys/vines';
import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiExtension, ApiOperation } from '@nestjs/swagger';
import { AddTwoNumberDto } from './dto/req/add-two-number.dto';
import { NthPowerOfDto } from './dto/req/nth-power-of.dto';

@Controller('worker')
export class WorkerController {
  @Get('/.well-known/monkey-plugin.json')
  public async getMetadata() {
    return {
      schema_version: 'v1',
      displayName: 'Simple Calc',
      description: 'A list of some simple calculation functions.',
      auth: {
        type: 'none',
      },
      api: {
        type: 'openapi',
        url: `http://127.0.0.1:${PORT}/api/worker/openapi-json`,
      },
      logo: '',
      contact_email: 'dev@inf-monkeys.com',
    };
  }

  @Post('/add-two-number')
  @ApiOperation({
    summary: 'Add Two Numbers',
    description: 'Simply add tow numbers.',
  })
  public async addTwoNumberExample(@Body() body: AddTwoNumberDto) {
    const { numA, numB } = body;
    return numA + numB;
  }

  @Post('/nth-power-of')
  @ApiOperation({
    summary: 'Calc Nth Power',
    description: 'Calc Nth Power, assumes may take a while ...',
  })
  @ApiExtension('x-monkey-block-def', {
    type: BlockType.SIMPLE,
    name: 'Calc Nth Power',
    description: 'Calc Nth Power, assumes may take a while ...',
    input: [
      {
        name: 'num',
        displayName: 'Number',
        required: true,
        type: 'number',
      },
      {
        name: 'n',
        displayName: 'N',
        required: true,
        type: 'number',
      },
    ],
  } as BlockDefinition)
  public async longTimeCalcExample(@Body() body: NthPowerOfDto) {
    const { num, n } = body;
    return Math.pow(num, n);
  }
}
