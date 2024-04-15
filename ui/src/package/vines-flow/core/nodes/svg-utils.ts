import { IVinesEdge, IVinesNodePosition, VinesEdgePath } from '@/package/vines-flow/core/nodes/typings.ts';

export enum VinesSVGPosition {
  Left = 'left',
  Top = 'top',
  Right = 'right',
  Bottom = 'bottom',
}

const handleDirections = {
  [VinesSVGPosition.Left]: { x: -1, y: 0 },
  [VinesSVGPosition.Right]: { x: 1, y: 0 },
  [VinesSVGPosition.Top]: { x: 0, y: -1 },
  [VinesSVGPosition.Bottom]: { x: 0, y: 1 },
};

interface GetSmoothStepPathParams {
  sourceX: number;
  sourceY: number;
  sourcePosition?: VinesSVGPosition;
  targetX: number;
  targetY: number;
  targetPosition?: VinesSVGPosition;
  borderRadius?: number;
  centerX?: number;
  centerY?: number;
  offset?: number;
}

export function moveTo(x: number, y: number): IVinesEdge {
  return {
    type: 'M',
    axis: [[x, y]],
  };
}

export function drawPureLine(x: number, y: number): IVinesEdge {
  return { type: 'L', axis: [[x, y]] };
}

export function drawLine(sourceX: number, sourceY: number, targetX: number, targetY: number): VinesEdgePath {
  return [moveTo(sourceX, sourceY), drawPureLine(targetX, targetY)];
}

export function getEdgeCenter({
  sourceX,
  sourceY,
  targetX,
  targetY,
}: {
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
}): [number, number, number, number] {
  const xOffset = Math.abs(targetX - sourceX) / 2;
  const centerX = targetX < sourceX ? targetX + xOffset : targetX - xOffset;

  const yOffset = Math.abs(targetY - sourceY) / 2;
  const centerY = targetY < sourceY ? targetY + yOffset : targetY - yOffset;

  return [centerX, centerY, xOffset, yOffset];
}

export const getDirection = ({
  source,
  sourcePosition = VinesSVGPosition.Bottom,
  target,
}: {
  source: IVinesNodePosition;
  sourcePosition: VinesSVGPosition;
  target: IVinesNodePosition;
}): IVinesNodePosition => {
  if (sourcePosition === VinesSVGPosition.Left || sourcePosition === VinesSVGPosition.Right) {
    return source.x < target.x ? { x: 1, y: 0 } : { x: -1, y: 0 };
  }
  return source.y < target.y ? { x: 0, y: 1 } : { x: 0, y: -1 };
};

export const distance = (a: IVinesNodePosition, b: IVinesNodePosition) =>
  Math.sqrt(Math.pow(b.x - a.x, 2) + Math.pow(b.y - a.y, 2));

export function getPoints({
  source,
  sourcePosition = VinesSVGPosition.Bottom,
  target,
  targetPosition = VinesSVGPosition.Top,
  center,
  offset,
}: {
  source: IVinesNodePosition;
  sourcePosition: VinesSVGPosition;
  target: IVinesNodePosition;
  targetPosition: VinesSVGPosition;
  center: Partial<IVinesNodePosition>;
  offset: number;
}): [IVinesNodePosition[], number, number, number, number] {
  const sourceDir = handleDirections[sourcePosition];
  const targetDir = handleDirections[targetPosition];
  const sourceGaped: IVinesNodePosition = { x: source.x + sourceDir.x * offset, y: source.y + sourceDir.y * offset };
  const targetGaped: IVinesNodePosition = { x: target.x + targetDir.x * offset, y: target.y + targetDir.y * offset };
  const dir = getDirection({
    source: sourceGaped,
    sourcePosition,
    target: targetGaped,
  });
  const dirAccessor = dir.x !== 0 ? 'x' : 'y';
  const currDir = dir[dirAccessor];

  let points: IVinesNodePosition[];
  let centerX, centerY;
  const sourceGapOffset = { x: 0, y: 0 };
  const targetGapOffset = { x: 0, y: 0 };

  const [defaultCenterX, defaultCenterY, defaultOffsetX, defaultOffsetY] = getEdgeCenter({
    sourceX: source.x,
    sourceY: source.y,
    targetX: target.x,
    targetY: target.y,
  });

  if (sourceDir[dirAccessor] * targetDir[dirAccessor] === -1) {
    centerX = center.x || defaultCenterX;
    centerY = center.y || defaultCenterY;

    const verticalSplit: IVinesNodePosition[] = [
      { x: centerX, y: sourceGaped.y },
      { x: centerX, y: targetGaped.y },
    ];

    const horizontalSplit: IVinesNodePosition[] = [
      { x: sourceGaped.x, y: centerY },
      { x: targetGaped.x, y: centerY },
    ];

    if (sourceDir[dirAccessor] === currDir) {
      points = dirAccessor === 'x' ? verticalSplit : horizontalSplit;
    } else {
      points = dirAccessor === 'x' ? horizontalSplit : verticalSplit;
    }
  } else {
    const sourceTarget: IVinesNodePosition[] = [{ x: sourceGaped.x, y: targetGaped.y }];
    const targetSource: IVinesNodePosition[] = [{ x: targetGaped.x, y: sourceGaped.y }];

    if (dirAccessor === 'x') {
      points = sourceDir.x === currDir ? targetSource : sourceTarget;
    } else {
      points = sourceDir.y === currDir ? sourceTarget : targetSource;
    }

    if (sourcePosition === targetPosition) {
      const diff = Math.abs(source[dirAccessor] - target[dirAccessor]);

      if (diff <= offset) {
        const gapOffset = Math.min(offset - 1, offset - diff);
        if (sourceDir[dirAccessor] === currDir) {
          sourceGapOffset[dirAccessor] = (sourceGaped[dirAccessor] > source[dirAccessor] ? -1 : 1) * gapOffset;
        } else {
          targetGapOffset[dirAccessor] = (targetGaped[dirAccessor] > target[dirAccessor] ? -1 : 1) * gapOffset;
        }
      }
    }

    if (sourcePosition !== targetPosition) {
      const dirAccessorOpposite = dirAccessor === 'x' ? 'y' : 'x';
      const isSameDir = sourceDir[dirAccessor] === targetDir[dirAccessorOpposite];
      const sourceGtTargetOppo = sourceGaped[dirAccessorOpposite] > targetGaped[dirAccessorOpposite];
      const sourceLtTargetOppo = sourceGaped[dirAccessorOpposite] < targetGaped[dirAccessorOpposite];
      const flipSourceTarget =
        (sourceDir[dirAccessor] === 1 && ((!isSameDir && sourceGtTargetOppo) || (isSameDir && sourceLtTargetOppo))) ||
        (sourceDir[dirAccessor] !== 1 && ((!isSameDir && sourceLtTargetOppo) || (isSameDir && sourceGtTargetOppo)));

      if (flipSourceTarget) {
        points = dirAccessor === 'x' ? sourceTarget : targetSource;
      }
    }

    const sourceGapPoint = { x: sourceGaped.x + sourceGapOffset.x, y: sourceGaped.y + sourceGapOffset.y };
    const targetGapPoint = { x: targetGaped.x + targetGapOffset.x, y: targetGaped.y + targetGapOffset.y };
    const maxXDistance = Math.max(Math.abs(sourceGapPoint.x - points[0].x), Math.abs(targetGapPoint.x - points[0].x));
    const maxYDistance = Math.max(Math.abs(sourceGapPoint.y - points[0].y), Math.abs(targetGapPoint.y - points[0].y));

    if (maxXDistance >= maxYDistance) {
      centerX = (sourceGapPoint.x + targetGapPoint.x) / 2;
      centerY = points[0].y;
    } else {
      centerX = points[0].x;
      centerY = (sourceGapPoint.y + targetGapPoint.y) / 2;
    }
  }

  const pathPoints = [
    source,
    { x: sourceGaped.x + sourceGapOffset.x, y: sourceGaped.y + sourceGapOffset.y },
    ...points,
    { x: targetGaped.x + targetGapOffset.x, y: targetGaped.y + targetGapOffset.y },
    target,
  ];

  return [pathPoints, centerX, centerY, defaultOffsetX, defaultOffsetY];
}

export function getBend(
  a: IVinesNodePosition,
  b: IVinesNodePosition,
  c: IVinesNodePosition,
  size: number,
): IVinesEdge[] {
  const bendSize = Math.min(distance(a, b) / 2, distance(b, c) / 2, size);
  const { x, y } = b;

  if ((a.x === x && x === c.x) || (a.y === y && y === c.y)) {
    return [drawPureLine(x, y)];
  }

  if (a.y === y) {
    const xDir = a.x < c.x ? -1 : 1;
    const yDir = a.y < c.y ? 1 : -1;
    return [
      drawPureLine(x + bendSize * xDir, y),
      {
        type: 'Q',
        axis: [
          [x, y],
          [x, y + bendSize * yDir],
        ],
      },
    ];
  }

  const xDir = a.x < c.x ? 1 : -1;
  const yDir = a.y < c.y ? -1 : 1;
  return [
    drawPureLine(x, y + bendSize * yDir),
    {
      type: 'Q',
      axis: [
        [x, y],
        [x + bendSize * xDir, y],
      ],
    },
  ];
}

export function test(position: { x: number; y: number }) {
  return drawLine(position.x, position.y, 0, 0);
}

export function drawPureSmoothLine({
  sourceX,
  sourceY,
  sourcePosition = VinesSVGPosition.Bottom,
  targetX,
  targetY,
  targetPosition = VinesSVGPosition.Top,
  borderRadius = 5,
  centerX,
  centerY,
  offset = 20,
}: GetSmoothStepPathParams): IVinesEdge[] {
  const [points] = getPoints({
    source: { x: sourceX, y: sourceY },
    sourcePosition,
    target: { x: targetX, y: targetY },
    targetPosition,
    center: { x: centerX, y: centerY },
    offset,
  });

  const edge: IVinesEdge[] = [];
  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    if (i > 0 && i < points.length - 1) {
      const prev = points[i - 1];
      const next = points[i + 1];
      edge.push(...getBend(prev, p, next, borderRadius));
    } else if (i !== 0) {
      edge.push(drawPureLine(p.x, p.y));
    }
  }

  return edge;
}

export function drawSmoothLine({
  sourceX,
  sourceY,
  sourcePosition = VinesSVGPosition.Bottom,
  targetX,
  targetY,
  targetPosition = VinesSVGPosition.Top,
  borderRadius = 10,
  centerX,
  centerY,
  offset = 20,
}: GetSmoothStepPathParams): IVinesEdge[] {
  return [
    moveTo(sourceX, sourceY),
    ...drawPureSmoothLine({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
      borderRadius,
      centerX,
      centerY,
      offset,
    }),
  ];
}
