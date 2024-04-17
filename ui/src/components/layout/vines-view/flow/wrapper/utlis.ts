import { BoundsType, PositionType, ReactZoomPanPinchContext } from 'react-zoom-pan-pinch';

export const roundNumber = (num: number, decimal: number) => {
  return Number(num.toFixed(decimal));
};

export const boundLimiter = (value: number, minBound: number, maxBound: number, isActive: boolean) => {
  if (!isActive) return roundNumber(value, 2);
  if (value < minBound) return roundNumber(minBound, 2);
  if (value > maxBound) return roundNumber(maxBound, 2);
  return roundNumber(value, 2);
};

export function checkPositionBounds(
  positionX: number,
  positionY: number,
  bounds: { minPositionX: number; minPositionY: number; maxPositionX: number; maxPositionY: number },
  limitToBounds: boolean,
  paddingValue: number,
  wrapperComponent: { offsetWidth: number; offsetHeight: number },
) {
  const { minPositionX, minPositionY, maxPositionX, maxPositionY } = bounds;
  const paddingX = wrapperComponent ? (paddingValue * wrapperComponent.offsetWidth) / 100 : 0;
  const paddingY = wrapperComponent ? (paddingValue * wrapperComponent.offsetHeight) / 100 : 0;

  const x = boundLimiter(positionX, minPositionX - paddingX, maxPositionX + paddingX, limitToBounds);

  const y = boundLimiter(positionY, minPositionY - paddingY, maxPositionY + paddingY, limitToBounds);
  return { x, y };
}

export type ComponentsSizesType = {
  wrapperWidth: number;
  wrapperHeight: number;
  newContentWidth: number;
  newDiffWidth: number;
  newContentHeight: number;
  newDiffHeight: number;
};

export function getComponentsSizes(
  wrapperComponent: HTMLDivElement,
  contentComponent: HTMLDivElement,
  newScale: number,
): ComponentsSizesType {
  const wrapperWidth = wrapperComponent.offsetWidth;
  const wrapperHeight = wrapperComponent.offsetHeight;

  const contentWidth = contentComponent.offsetWidth;
  const contentHeight = contentComponent.offsetHeight;

  const newContentWidth = contentWidth * newScale;
  const newContentHeight = contentHeight * newScale;
  const newDiffWidth = wrapperWidth - newContentWidth;
  const newDiffHeight = wrapperHeight - newContentHeight;

  return {
    wrapperWidth,
    wrapperHeight,
    newContentWidth,
    newDiffWidth,
    newContentHeight,
    newDiffHeight,
  };
}

export const getBounds = (
  wrapperWidth: number,
  newContentWidth: number,
  diffWidth: number,
  wrapperHeight: number,
  newContentHeight: number,
  diffHeight: number,
  centerZoomedOut: boolean,
): BoundsType => {
  const scaleWidthFactor = wrapperWidth > newContentWidth ? diffWidth * (centerZoomedOut ? 1 : 0.5) : 0;
  const scaleHeightFactor = wrapperHeight > newContentHeight ? diffHeight * (centerZoomedOut ? 1 : 0.5) : 0;

  const minPositionX = wrapperWidth - newContentWidth - scaleWidthFactor;
  const maxPositionX = scaleWidthFactor;
  const minPositionY = wrapperHeight - newContentHeight - scaleHeightFactor;
  const maxPositionY = scaleHeightFactor;

  return { minPositionX, maxPositionX, minPositionY, maxPositionY };
};

export const calculateBounds = (contextInstance: ReactZoomPanPinchContext, newScale: number): BoundsType => {
  const { wrapperComponent, contentComponent } = contextInstance;
  const { centerZoomedOut } = contextInstance.setup;

  if (!wrapperComponent || !contentComponent) {
    throw new Error('Components are not mounted');
  }

  const { wrapperWidth, wrapperHeight, newContentWidth, newDiffWidth, newContentHeight, newDiffHeight } =
    getComponentsSizes(wrapperComponent, contentComponent, newScale);

  return getBounds(
    wrapperWidth,
    newContentWidth,
    newDiffWidth,
    wrapperHeight,
    newContentHeight,
    newDiffHeight,
    Boolean(centerZoomedOut),
  );
};
export const handleCalculateBounds = (contextInstance: ReactZoomPanPinchContext, newScale: number): BoundsType => {
  const bounds = calculateBounds(contextInstance, newScale);

  contextInstance.bounds = bounds;
  return bounds;
};

export function checkZoomBounds(
  zoom: number,
  minScale: number,
  maxScale: number,
  zoomPadding: number,
  enablePadding: boolean,
): number {
  const scalePadding = enablePadding ? zoomPadding : 0;
  const minScaleWithPadding = minScale - scalePadding;

  if (!Number.isNaN(maxScale) && zoom >= maxScale) return maxScale;
  if (!Number.isNaN(minScale) && zoom <= minScaleWithPadding) return minScaleWithPadding;
  return zoom;
}

export function getMouseBoundedPosition(
  positionX: number,
  positionY: number,
  bounds: BoundsType,
  limitToBounds: boolean,
  paddingValueX: number,
  paddingValueY: number,
  wrapperComponent: HTMLDivElement | null,
): PositionType {
  const { minPositionX, minPositionY, maxPositionX, maxPositionY } = bounds;

  let paddingX = 0;
  let paddingY = 0;

  if (wrapperComponent) {
    paddingX = paddingValueX;
    paddingY = paddingValueY;
  }

  const x = boundLimiter(positionX, minPositionX - paddingX, maxPositionX + paddingX, limitToBounds);

  const y = boundLimiter(positionY, minPositionY - paddingY, maxPositionY + paddingY, limitToBounds);
  return { x, y };
}

export function handleCalculateZoomPositions(
  contextInstance: ReactZoomPanPinchContext,
  mouseX: number,
  mouseY: number,
  newScale: number,
  bounds: BoundsType,
  limitToBounds: boolean,
): PositionType {
  const { scale, positionX, positionY } = contextInstance.transformState;

  const scaleDifference = newScale - scale;

  const calculatedPositionX = positionX - mouseX * scaleDifference;
  const calculatedPositionY = positionY - mouseY * scaleDifference;

  return getMouseBoundedPosition(calculatedPositionX, calculatedPositionY, bounds, limitToBounds, 0, 0, null);
}
export function handleZoomToPoint(
  contextInstance: ReactZoomPanPinchContext,
  scale: number,
  mouseX: number,
  mouseY: number,
): { scale: number; positionX: number; positionY: number } | undefined {
  const { minScale, maxScale, limitToBounds } = contextInstance.setup;

  const newScale = checkZoomBounds(roundNumber(scale, 2), minScale, maxScale, 0, false);
  const bounds = handleCalculateBounds(contextInstance, newScale);

  const { x, y } = handleCalculateZoomPositions(contextInstance, mouseX, mouseY, newScale, bounds, limitToBounds);

  return { scale: newScale, positionX: x, positionY: y };
}

export function getMousePosition(
  event: WheelEvent | MouseEvent | TouchEvent,
  contentComponent: HTMLDivElement,
  scale: number,
): PositionType {
  const contentRect = contentComponent.getBoundingClientRect();

  let mouseX: number;
  let mouseY: number;

  if ('clientX' in event) {
    mouseX = (event.clientX - contentRect.left) / scale;
    mouseY = (event.clientY - contentRect.top) / scale;
  } else {
    const touch = event.touches[0];
    mouseX = (touch.clientX - contentRect.left) / scale;
    mouseY = (touch.clientY - contentRect.top) / scale;
  }

  if (Number.isNaN(mouseX) || Number.isNaN(mouseY)) console.error('No mouse or touch offset found');

  return {
    x: mouseX,
    y: mouseY,
  };
}

export function getXYPosition(
  x: number,
  y: number,
  contentComponent: HTMLDivElement,
  wrapperComponent: HTMLDivElement,
  scale: number,
): PositionType {
  const contentWidth = contentComponent.offsetWidth * scale;
  const contentHeight = contentComponent.offsetHeight * scale;

  const centerPositionX = (wrapperComponent.offsetWidth - contentWidth) / 2;
  const centerPositionY = (wrapperComponent.offsetHeight - contentHeight) / 2;

  const newX = centerPositionX + x;
  const newY = centerPositionY + y;

  return {
    x: newX,
    y: newY,
  };
}

export type Coordinates = {
  x: number;
  y: number;
};

export type DistanceMeasurement = number | Coordinates | Pick<Coordinates, 'x'> | Pick<Coordinates, 'y'>;
export function hasExceededDistance(delta: Coordinates, measurement: DistanceMeasurement): boolean {
  const dx = Math.abs(delta.x);
  const dy = Math.abs(delta.y);

  if (typeof measurement === 'number') {
    return Math.sqrt(dx ** 2 + dy ** 2) > measurement;
  }

  if ('x' in measurement && 'y' in measurement) {
    return dx > measurement.x && dy > measurement.y;
  }

  if ('x' in measurement) {
    return dx > measurement.x;
  }

  if ('y' in measurement) {
    return dy > measurement.y;
  }

  return false;
}
