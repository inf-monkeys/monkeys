import { ArgumentMetadata, BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';

@Injectable()
export class StrictValidationPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    if (!metadata.metatype || this.skipValidate(metadata.metatype)) {
      return value;
    }

    const object = plainToInstance(metadata.metatype as any, value);
    const errors = validateSync(object as Record<string, unknown>, {
      whitelist: true,
      forbidUnknownValues: true,
      forbidNonWhitelisted: false,
    });

    if (errors.length > 0) {
      const messages = errors
        .map((err) => (err.constraints ? Object.values(err.constraints) : []))
        .flat()
        .join('; ');
      throw new BadRequestException(`Validation failed: ${messages}`);
    }

    return object;
  }

  private skipValidate(metatype: any): boolean {
    const types: any[] = [String, Boolean, Number, Array, Object];
    return types.includes(metatype);
  }
}
