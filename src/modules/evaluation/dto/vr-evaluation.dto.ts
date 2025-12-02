import { Type } from 'class-transformer';
import { IsInt, IsObject, IsString, Max, Min, ValidateNested } from 'class-validator';

class EvaluationResultRequestDto {
  @IsInt()
  @Min(1)
  @Max(5)
  score_1: number;

  @IsInt()
  @Min(1)
  @Max(5)
  score_2: number;

  @IsInt()
  @Min(1)
  @Max(5)
  score_3: number;

  @IsInt()
  @Min(1)
  @Max(5)
  score_4: number;

  @IsInt()
  @Min(1)
  @Max(5)
  score_5: number;

  @IsInt()
  @Min(1)
  @Max(5)
  score_6: number;

  @IsInt()
  @Min(1)
  @Max(5)
  score_7: number;

  @IsInt()
  @Min(1)
  @Max(5)
  score_8: number;

  @IsInt()
  @Min(1)
  @Max(5)
  score_9: number;

  @IsInt()
  @Min(1)
  @Max(5)
  score_10: number;
}

export class UpdateEvaluationDataRequestDto {
  // Vision Pro 端传递为 taskId（与接口文档一致）
  @IsString()
  taskId: string;

  @IsObject()
  @ValidateNested()
  @Type(() => EvaluationResultRequestDto)
  evaluationResult: EvaluationResultRequestDto;
}
