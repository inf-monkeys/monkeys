/**
 * Generic version of getAllConnectedNodes that works with all shape types
 */
import { Editor, TLShapeId } from 'tldraw';

import { getShapePortConnections } from './portConnections';

/**
 * Traverse the graph from a starting shape, in a given direction, returning all the shapes that are
 * connected to it (including the starting shape).
 * Works with any shape type that has ports (node, instruction, output, workflow)
 */
export function getAllConnectedShapes(
  editor: Editor,
  startingShape: TLShapeId | { id: TLShapeId },
  direction?: 'start' | 'end',
): Set<TLShapeId> {
  const toVisit = [typeof startingShape === 'string' ? startingShape : startingShape.id];
  const found = new Set<TLShapeId>();

  while (toVisit.length > 0) {
    const shapeId = toVisit.shift();
    if (!shapeId) continue;

    const shape = editor.getShape(shapeId);
    if (!shape) continue;

    // Skip if already visited
    if (found.has(shape.id)) continue;
    found.add(shape.id);

    // Get connections for this shape (works with all shape types)
    const connections = getShapePortConnections(editor, shape.id);
    for (const connection of connections) {
      if (direction && connection.terminal !== direction) continue;
      toVisit.push(connection.connectedShapeId);
    }
  }

  return found;
}
