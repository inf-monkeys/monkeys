/**
 * Generic port connection utilities that work with all shape types
 */
import { Editor, TLShapeId } from 'tldraw';
import { ConnectionBinding } from '../../workflow-examples/src/connection/ConnectionBindingUtil';
import { PortId } from '../../workflow-examples/src/ports/Port';

/**
 * Get all connection bindings for a shape (works with any shape type)
 */
export function getShapePortConnections(
  editor: Editor,
  shapeId: TLShapeId
): Array<{
  connectedShapeId: TLShapeId;
  connectionId: TLShapeId;
  terminal: 'start' | 'end';
  ownPortId: PortId;
  connectedPortId: PortId;
}> {
  const bindings = editor.getBindingsToShape<ConnectionBinding>(shapeId, 'connection');
  const connections: Array<{
    connectedShapeId: TLShapeId;
    connectionId: TLShapeId;
    terminal: 'start' | 'end';
    ownPortId: PortId;
    connectedPortId: PortId;
  }> = [];

  for (const binding of bindings) {
    const oppositeTerminal = binding.props.terminal === 'start' ? 'end' : 'start';
    const allBindings = editor.getBindingsFromShape<ConnectionBinding>(binding.fromId, 'connection');
    const oppositeBinding = allBindings.find((b) => b.props.terminal === oppositeTerminal);

    if (!oppositeBinding) continue;

    connections.push({
      connectedShapeId: oppositeBinding.toId,
      connectionId: binding.fromId,
      terminal: binding.props.terminal,
      ownPortId: binding.props.portId,
      connectedPortId: oppositeBinding.props.portId,
    });
  }

  return connections;
}

