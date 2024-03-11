import { ArgumentMetadata, BadRequestException, Injectable, Optional, PipeTransform } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import Joi from 'joi';
import * as Joiful from 'joiful';
import { Constructor, getJoiSchema } from 'joiful/core';

type Mergeable = Constructor<any> | Joi.AnySchema;

@Injectable()
export class ValidationPipe implements PipeTransform {
  constructor(
    @Optional() private schemas?: Mergeable[],
    @Optional() private wrapSchemaAsArray?: boolean,
  ) {}
  mergeSchemas(): Joi.AnySchema {
    return this.schemas.reduce((merged: Joi.AnySchema, current) => {
      const schema = current.hasOwnProperty('isJoi') && current['isJoi'] ? (current as Joi.AnySchema) : (getJoiSchema(current as Constructor<any>, Joi) as unknown as Joi.AnySchema);
      return merged ? merged.concat(schema) : schema;
    }, undefined) as Joi.Schema;
  }

  validateAsSchema(value: any) {
    const { error } = Array.isArray(value) && this.wrapSchemaAsArray ? Joi.array().items(this.mergeSchemas()).validate(value) : this.mergeSchemas().validate(value);
    if (error) throw new BadRequestException(`Validation failed: ${error.message}`);
  }

  validateAsClass(value: any, metadata: ArgumentMetadata): void | never {
    const { error } = Array.isArray(value) ? Joiful.validateArrayAsClass(value, metadata.metatype as Constructor<any>) : Joiful.validateAsClass(value, metadata.metatype as Constructor<any>);
    if (error) throw new BadRequestException(`Validation failed: ${error.message}`);
  }

  transform(value: any, metadata: ArgumentMetadata) {
    if (!metadata.metatype || !this.toValidate(metadata.metatype)) {
      return value;
    }
    const object = plainToInstance(metadata.metatype, value);
    if (!this.schemas) return object;
    if (this.schemas) this.validateAsSchema(object);
    else this.validateAsClass(object, metadata);
    return object;
  }

  private toValidate(metatype: any): boolean {
    const types: any[] = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }
}
