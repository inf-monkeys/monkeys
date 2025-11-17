import {
  BindingOnChangeOptions,
  BindingOnCreateOptions,
  BindingOnDeleteOptions,
  BindingOnShapeDeleteOptions,
  BindingOnShapeIsolateOptions,
  BindingUtil,
  createComputedCache,
  Editor,
  T,
  TLBaseBinding,
  TLShapeId,
} from 'tldraw';

import { getShapePorts } from '../../../shapes/ports/shapePorts';
import { getNodePorts } from '../nodes/nodePorts';
import { NodeShape } from '../nodes/NodeShapeUtil';
import { onNodePortConnect, onNodePortDisconnect } from '../nodes/nodeTypes';
import { PortId } from '../ports/Port';
import { ConnectionShape } from './ConnectionShapeUtil';

/**
 * A connection binding is a binding between a connection shape and a node shape. Usually, each
 * connection shape has two bindings: one for each end of the connection.
 */
export type ConnectionBinding = TLBaseBinding<
  'connection',
  {
    portId: PortId;
    terminal: 'start' | 'end';
  }
>;

export class ConnectionBindingUtil extends BindingUtil<ConnectionBinding> {
  static override type = 'connection' as const;
  static override props = {
    portId: T.string,
    terminal: T.literalEnum('start', 'end'),
  };

  override getDefaultProps() {
    return {};
  }

  onBeforeIsolateToShape({ binding }: BindingOnShapeIsolateOptions<ConnectionBinding>): void {
    // When we're duplicating a node but not its connection, delete the connection
    this.editor.deleteShapes([binding.fromId]);
  }

  onBeforeDeleteToShape({ binding }: BindingOnShapeDeleteOptions<ConnectionBinding>): void {
    // When we're deleting a node, delete any connections that are bound to it
    this.editor.deleteShapes([binding.fromId]);
  }

  onAfterCreate({ binding }: BindingOnCreateOptions<ConnectionBinding>): void {
    // Our ports system has an `onConnect` callback - call it when we create a connection
    const shape = this.editor.getShape(binding.toId);
    if (!shape) return;

    // Support node shapes
    if (this.editor.isShapeOfType<NodeShape>(shape, 'node')) {
      onNodePortConnect(this.editor, shape, binding.props.portId);
    }
    // Support instruction, output, workflow shapes (they don't have connect callbacks currently)
  }

  onAfterChange({ bindingBefore, bindingAfter }: BindingOnChangeOptions<ConnectionBinding>): void {
    // We also might need to call the connection callbacks if we change the thing this connection is binding to.
    if (bindingBefore.props.portId !== bindingAfter.props.portId || bindingBefore.toId !== bindingAfter.toId) {
      const shapeBefore = this.editor.getShape(bindingBefore.toId);
      const shapeAfter = this.editor.getShape(bindingAfter.toId);
      if (!shapeBefore || !shapeAfter) {
        return;
      }

      // Support node shapes
      if (
        this.editor.isShapeOfType<NodeShape>(shapeBefore, 'node') &&
        this.editor.isShapeOfType<NodeShape>(shapeAfter, 'node')
      ) {
        onNodePortDisconnect(this.editor, shapeBefore, bindingBefore.props.portId);
        onNodePortConnect(this.editor, shapeAfter, bindingAfter.props.portId);
      }
      // Support instruction, output, workflow shapes (they don't have connect callbacks currently)
    }
  }

  onAfterDelete({ binding }: BindingOnDeleteOptions<ConnectionBinding>): void {
    // When we're deleting a connection, we need to call the shape's port disconnect callback
    const shape = this.editor.getShape(binding.toId);
    if (!shape) return;

    // Support node shapes
    if (this.editor.isShapeOfType<NodeShape>(shape, 'node')) {
      onNodePortDisconnect(this.editor, shape, binding.props.portId);
    }
    // Support instruction, output, workflow shapes (they don't have connect callbacks currently)
  }
}

/** The bindings associated with a specific connection shape. */
export interface ConnectionBindings {
  start?: ConnectionBinding;
  end?: ConnectionBinding;
}

/** Get the bindings associated with a specific connection shape. */
export function getConnectionBindings(editor: Editor, shape: ConnectionShape | TLShapeId): ConnectionBindings {
  // we cache the bindings so we don't have to recompute them every time - this function gets called a lot.
  return connectionBindingsCache.get(editor, typeof shape === 'string' ? shape : shape.id) ?? {};
}

const connectionBindingsCache = createComputedCache(
  'connection bindings',
  (editor: Editor, connection: ConnectionShape) => {
    const bindings = editor.getBindingsFromShape<ConnectionBinding>(connection.id, 'connection');
    let start, end;
    for (const binding of bindings) {
      if (binding.props.terminal === 'start') {
        start = binding;
      } else if (binding.props.terminal === 'end') {
        end = binding;
      }
    }
    return { start, end };
  },
  {
    // we only look at the arrow IDs:
    areRecordsEqual: (a, b) => a.id === b.id,
    // the records should stay the same:
    areResultsEqual: (a, b) => a.start === b.start && a.end === b.end,
  },
);

/** Get the position of a connection binding in page space. */
export function getConnectionBindingPositionInPageSpace(editor: Editor, binding: ConnectionBinding) {
  // Find the shape that this binding is bound to
  const targetShape = editor.getShape(binding.toId);
  if (!targetShape) return null;

  let port = null;

  // Get ports for different shape types
  if (editor.isShapeOfType<NodeShape>(targetShape, 'node')) {
    port = getNodePorts(editor, targetShape)?.[binding.props.portId];
  } else if (
    targetShape.type === 'instruction' ||
    targetShape.type === 'output' ||
    targetShape.type === 'workflow' ||
    targetShape.type === 'live-image'
  ) {
    port = getShapePorts(editor, targetShape as any)?.[binding.props.portId];
  }

  if (!port) return null;

  // Transform the port position from shape space to page space
  const shapeTransform = editor.getShapePageTransform(targetShape);
  if (!shapeTransform) return null;

  // Ensure port has valid x and y properties
  if (typeof port.x !== 'number' || typeof port.y !== 'number') return null;

  return shapeTransform.applyToPoint(port);
}

/**
 * Create or update a connection binding. This utility makes sure that there are only ever two
 * connection bindings per connection shape - a start and an end.
 */
export function createOrUpdateConnectionBinding(
  editor: Editor,
  connection: ConnectionShape | TLShapeId,
  target: NodeShape | TLShapeId,
  props: ConnectionBinding['props'],
) {
  const connectionId = typeof connection === 'string' ? connection : connection.id;
  const targetId = typeof target === 'string' ? target : target.id;

  const existingMany = editor
    .getBindingsFromShape<ConnectionBinding>(connectionId, 'connection')
    .filter((b) => b.props.terminal === props.terminal);

  // if we've somehow ended up with too many bindings, delete the extras
  if (existingMany.length > 1) {
    editor.deleteBindings(existingMany.slice(1));
  }

  const existing = existingMany[0];
  if (existing) {
    editor.updateBinding({
      ...existing,
      toId: targetId,
      props,
    });
  } else {
    editor.createBinding({
      type: 'connection',
      fromId: connectionId,
      toId: targetId,
      props,
    });
  }
}

/** Remove a connection binding. */
export function removeConnectionBinding(editor: Editor, connection: ConnectionShape, terminal: 'start' | 'end') {
  const existing = editor
    .getBindingsFromShape<ConnectionBinding>(connection, 'connection')
    .filter((b) => b.props.terminal === terminal);

  editor.deleteBindings(existing);
}
