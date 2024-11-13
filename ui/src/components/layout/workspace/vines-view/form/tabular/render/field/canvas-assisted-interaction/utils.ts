export type TCalculateRelativePositionParams = {
  min?: number;
  max?: number;
  step?: number;
};

interface ICalculatePositionParams {
  canvasWidth: number;
  canvasHeight: number;
  X?: number;
  Y?: number;
  valueX?: number;
  valueY?: number;
  xParams?: TCalculateRelativePositionParams;
  yParams?: TCalculateRelativePositionParams;
}

const roundToStep = (value: number, step: number = 1): number => {
  const decimals = (step.toString().split('.')[1] || '').length;
  return parseFloat((Math.round(value / step) * step).toFixed(decimals));
};

export const calculatePosition = ({
  canvasWidth,
  canvasHeight,
  X,
  Y,
  valueX,
  valueY,
  xParams,
  yParams,
}: ICalculatePositionParams) => {
  // 将 canvasWidth 和 canvasHeight 限制在 step 的精度范围内
  const adjustedCanvasWidth = roundToStep(canvasWidth, xParams?.step);
  const adjustedCanvasHeight = roundToStep(canvasHeight, yParams?.step);

  // 计算相对位置
  const elementX = xParams
    ? X !== undefined
      ? roundToStep(
          Math.min(Math.max((X / adjustedCanvasWidth) * (xParams.max ?? 100), xParams.min ?? 0), xParams.max ?? 100),
          xParams.step,
        )
      : undefined
    : undefined;

  const elementY = yParams
    ? Y !== undefined
      ? roundToStep(
          Math.min(Math.max((Y / adjustedCanvasHeight) * (yParams.max ?? 100), yParams.min ?? 0), yParams.max ?? 100),
          yParams.step,
        )
      : undefined
    : undefined;

  // 反向计算画布位置
  const canvasX = valueX !== undefined && xParams ? (valueX / (xParams.max ?? 100)) * adjustedCanvasWidth : undefined;

  const canvasY = valueY !== undefined && yParams ? (valueY / (yParams.max ?? 100)) * adjustedCanvasHeight : undefined;

  return {
    x: elementX,
    y: elementY,
    canvasX,
    canvasY,
  };
};
