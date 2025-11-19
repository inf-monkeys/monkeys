import { Editor, TLShapeId } from 'tldraw';

import type { ShapePort } from '../../workflow-examples/src/ports/Port';
import type { LiveImageShape } from '../live-image/LiveImageShapeUtil';

/**
 * Get ports for a LiveImage shape
 * LiveImage has one output port on the right side (for connecting to Output / Workflow)
 */
export function getLiveImagePorts(
  editor: Editor,
  shape: LiveImageShape | TLShapeId,
): Record<string, ShapePort> {
  const liveShape =
    typeof shape === 'string' ? (editor.getShape(shape) as LiveImageShape | undefined) : shape;
  if (!liveShape) return {};

  const width = liveShape.props.w;
  const height = liveShape.props.h;
  const centerY = height / 2;

  return {
    output: {
      id: 'output',
      x: width, // Right side
      y: centerY,
      terminal: 'start', // Output port
    },
  };
}


