import { Editor, Vec, VecLike } from 'tldraw';

import { getShapePortConnections } from '../../../shapes/ports/portConnections';
import { getShapePorts } from '../../../shapes/ports/shapePorts';
import { getNodePorts } from '../nodes/nodePorts';
import { NodeShape } from '../nodes/NodeShapeUtil';
import { ShapePort } from './Port';

export function getPortAtPoint(editor: Editor, point: VecLike, opts?: { terminal?: 'start' | 'end'; margin?: number }) {
  // find the shape at that point - now support all shape types with ports
  const shape = editor.getShapeAtPoint(point, {
    hitInside: true,
    // Allow node shapes and custom shapes (instruction, output, workflow, live-image)
    filter: (shape) =>
      editor.isShapeOfType<NodeShape>(shape, 'node') ||
      shape.type === 'instruction' ||
      shape.type === 'output' ||
      shape.type === 'workflow' ||
      shape.type === 'live-image',
    ...opts,
  });
  if (!shape) return null;

  // get the ports on that shape - support both node and custom shapes
  let ports: Record<string, ShapePort> | null = null;
  if (editor.isShapeOfType<NodeShape>(shape, 'node')) {
    ports = getNodePorts(editor, shape);
  } else if (
    shape.type === 'instruction' ||
    shape.type === 'output' ||
    shape.type === 'workflow' ||
    shape.type === 'live-image'
  ) {
    ports = getShapePorts(editor, shape as any);
  }

  if (!ports) return null;

  // transform the ports to page space
  const shapeTransform = editor.getShapePageTransform(shape);
  if (!shapeTransform) return null;

  // find the port closest to the point
  let bestPort: ShapePort | null = null;
  let bestDistance = Infinity;

  for (const port of Object.values(ports)) {
    if (opts?.terminal && port.terminal !== opts.terminal) continue;

    // Ensure port has valid x and y properties
    if (typeof port.x !== 'number' || typeof port.y !== 'number') continue;

    const portInPageSpace = shapeTransform.applyToPoint(port);
    const distance = Vec.Dist(point, portInPageSpace);
    if (distance < bestDistance) {
      bestPort = port;
      bestDistance = distance;
    }
  }

  // if we didn't find a port, return null
  if (!bestPort) return null;

  // otherwise, return the port and it's existing connections
  // Use generic connection getter for all shape types
  const existingConnections = getShapePortConnections(editor, shape.id).filter((c) => c.ownPortId === bestPort.id);
  return { shape, port: bestPort, existingConnections };
}
