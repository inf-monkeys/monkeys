import classNames from 'classnames';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  clamp,
  createShapeId,
  CubicBezier2d,
  Editor,
  IndexKey,
  Mat,
  RecordProps,
  ShapeUtil,
  stopEventPropagation,
  SVGContainer,
  T,
  TLBaseShape,
  TLHandle,
  TLHandleDragInfo,
  useEditor,
  useValue,
  Vec,
  VecLike,
  VecModel,
  vecModelValidator,
} from 'tldraw';

import { getAllConnectedShapes } from '../../../shapes/ports/getAllConnectedShapes';
import { onCanvasComponentPickerState } from '../../../workflow-ui/OnCanvasComponentPicker';
import { CONNECTION_CENTER_HANDLE_HOVER_SIZE_PX, CONNECTION_CENTER_HANDLE_SIZE_PX } from '../constants';
import { getNodeOutputPortInfo, getNodePorts } from '../nodes/nodePorts';
import { NodeShape } from '../nodes/NodeShapeUtil';
import { STOP_EXECUTION } from '../nodes/types/shared';
import { getPortAtPoint } from '../ports/getPortAtPoint';
import { updatePortState } from '../ports/portState';
import {
  createOrUpdateConnectionBinding,
  getConnectionBindingPositionInPageSpace,
  getConnectionBindings,
  removeConnectionBinding,
} from './ConnectionBindingUtil';
import { insertNodeWithinConnection } from './insertNodeWithinConnection';

/**
 * A connection shape is a directed connection between two node shapes. It has a start point, and an
 * end point. These are called "terminals" in the code.
 *
 * Usually, a connection will also have two ConnectionBindings. These bind each end of the shape to
 * the nodes it's connected to. The `start` and `end` properties are the positions of each end of
 * the connection, but only when there isn't a binding (ie while dragging the connection). When the
 * ends are bound, the position is derived from the connected shape instead.
 */
export type ConnectionShape = TLBaseShape<
  'connection',
  {
    start: VecModel;
    end: VecModel;
    label?: string;
  }
>;

export class ConnectionShapeUtil extends ShapeUtil<ConnectionShape> {
  static override type = 'connection' as const;
  static override props: RecordProps<ConnectionShape> = {
    start: vecModelValidator,
    end: vecModelValidator,
    label: T.string,
  };

  getDefaultProps(): ConnectionShape['props'] {
    return {
      start: { x: 0, y: 0 },
      end: { x: 100, y: 100 },
      label: '',
    };
  }

  override canEdit() {
    return false;
  }
  override canResize() {
    return false;
  }
  override hideResizeHandles() {
    return true;
  }
  override hideRotateHandle() {
    return true;
  }
  override hideSelectionBoundsBg() {
    return true;
  }
  override hideSelectionBoundsFg() {
    return true;
  }
  override canSnap() {
    // disable snapping this shape to other shapes
    return false;
  }
  override getBoundsSnapGeometry() {
    return {
      // disable snapping other shape to this shape
      points: [],
    };
  }

  // Define the geometry of our connection shape as a cubic bezier curve
  getGeometry(connection: ConnectionShape) {
    const { start, end } = getConnectionTerminals(this.editor, connection);
    const [cp1, cp2] = getConnectionControlPoints(start, end);
    return new CubicBezier2d({
      start: Vec.From(start),
      cp1: Vec.From(cp1),
      cp2: Vec.From(cp2),
      end: Vec.From(end),
    });
  }

  getHandles(connection: ConnectionShape): TLHandle[] {
    // Handles are draggable points on a shape. In our connection shape, we have a handle at each end.
    const { start, end } = getConnectionTerminals(this.editor, connection);
    return [
      {
        id: 'start',
        type: 'vertex',
        index: 'a0' as IndexKey,
        x: start.x,
        y: start.y,
      },
      {
        id: 'end',
        type: 'vertex',
        index: 'a1' as IndexKey,
        x: end.x,
        y: end.y,
      },
    ];
  }

  // Handle dragging of connection terminals to connect/disconnect from ports
  onHandleDrag(connection: ConnectionShape, { handle }: TLHandleDragInfo<ConnectionShape>) {
    // 如果是只读模式，禁止拖拽连线
    if (this.editor.getInstanceState().isReadonly) {
      return connection;
    }

    // First, get some info about the connection and the terminal we're dragging
    const existingBindings = getConnectionBindings(this.editor, connection);
    const draggingTerminal = handle.id as 'start' | 'end';
    const oppositeTerminal = draggingTerminal === 'start' ? 'end' : 'start';
    const oppositeTerminalShapeId = existingBindings[oppositeTerminal]?.toId;

    // Find the new position of the handle in page space
    const shapeTransform = this.editor.getShapePageTransform(connection);
    if (!shapeTransform) return;
    const handlePagePosition = shapeTransform.applyToPoint(handle);

    // Find the port at the new position
    const target = getPortAtPoint(this.editor, handlePagePosition, {
      margin: 8,
      terminal: handle.id as 'start' | 'end',
    });

    // only 'start' ports (outputs) can have multiple connections
    const allowsMultipleConnections = draggingTerminal === 'start';

    // does this port have an existing connection (excluding this one)?
    const hasExistingConnection = target?.existingConnections.some((c) => c.connectionId !== connection.id) ?? false;

    // find out which shapes would create a cycle based on what the other end of the connection
    // is bound to - use generic version that works with all shape types
    const nodesWhichWouldCreateACycle = oppositeTerminalShapeId
      ? getAllConnectedShapes(this.editor, oppositeTerminalShapeId, draggingTerminal)
      : null;

    // update our port UI state to highlight which ports are eligible to connect to
    updatePortState(this.editor, {
      eligiblePorts: {
        terminal: draggingTerminal,
        excludeNodes: nodesWhichWouldCreateACycle,
      },
    });

    // if for whatever reason we can't connect to this port...
    const wouldCreateACycle = (target && nodesWhichWouldCreateACycle?.has(target.shape.id)) ?? false;
    if (!target || (hasExistingConnection && !allowsMultipleConnections) || wouldCreateACycle) {
      // ... update our port ui state to not highlight any ports...
      updatePortState(this.editor, { hintingPort: null });

      // ... remove any existing binding for this connection terminal...
      removeConnectionBinding(this.editor, connection, draggingTerminal);

      // ... and return the connection with the new position.
      return {
        ...connection,
        props: {
          [handle.id]: { x: handle.x, y: handle.y },
        },
      };
    }

    // if we can connect to this port, update our port ui state to highlight the port we're
    // connecting to
    updatePortState(this.editor, {
      hintingPort: { portId: target.port.id, shapeId: target.shape.id },
    });

    // create or update the connection binding for this connection terminal
    createOrUpdateConnectionBinding(this.editor, connection, target.shape.id, {
      portId: target.port.id,
      terminal: draggingTerminal,
    });

    // return the connection unmodified because we only need to update the binding.
    return connection;
  }

  // Handle the end of dragging a connection terminal
  onHandleDragEnd(connection: ConnectionShape, { handle, isCreatingShape }: TLHandleDragInfo<ConnectionShape>) {
    // 如果是只读模式，只清理状态，不执行任何操作
    if (this.editor.getInstanceState().isReadonly) {
      updatePortState(this.editor, { hintingPort: null, eligiblePorts: null });
      return;
    }

    // clear our port UI state
    updatePortState(this.editor, { hintingPort: null, eligiblePorts: null });

    const draggingTerminal = handle.id as 'start' | 'end';

    // if we successfully connected & now have a binding, we're done!
    const bindings = getConnectionBindings(this.editor, connection);
    if (bindings[draggingTerminal]) {
      return;
    }

    // If we were creating a new connection and didn't attach it to anything,
    // check if we should open the component picker.
    // Only open the picker for NodeShape connections, not for Instruction/Output/Workflow
    if (isCreatingShape && draggingTerminal === 'end') {
      // Check if the start binding is connected to a NodeShape
      const startShape = bindings.start ? this.editor.getShape(bindings.start.toId) : null;
      const isNodeShapeConnection = startShape && this.editor.isShapeOfType<NodeShape>(startShape, 'node');

      if (isNodeShapeConnection) {
        // Only open the component picker for NodeShape connections
        this.editor.selectNone();
        onCanvasComponentPickerState.set(this.editor, {
          connectionShapeId: connection.id,
          location: draggingTerminal,
          onClose: () => {
            // if we didn't attach the connection to anything, delete it
            const bindings = getConnectionBindings(this.editor, connection);
            if (!bindings.start || !bindings.end) {
              this.editor.deleteShapes([connection.id]);
            }
          },
          onPick: (nodeType, terminalInPageSpace) => {
            // create the node based on the user's selection:
            const newNodeId = createShapeId();
            this.editor.createShape({
              type: 'node',
              id: newNodeId,
              x: terminalInPageSpace.x,
              y: terminalInPageSpace.y,
              props: {
                node: nodeType,
              },
            });
            this.editor.select(newNodeId);

            // Position the node so its input port aligns with the connection end
            const ports = getNodePorts(this.editor, newNodeId);
            const firstInputPort = Object.values(ports).find((p) => p.terminal === 'end');
            if (firstInputPort) {
              this.editor.updateShape({
                id: newNodeId,
                type: 'node',
                x: terminalInPageSpace.x - firstInputPort.x,
                y: terminalInPageSpace.y - firstInputPort.y,
              });

              // bind the connection to the node's first input port
              createOrUpdateConnectionBinding(this.editor, connection, newNodeId, {
                portId: firstInputPort.id,
                terminal: draggingTerminal,
              });
            }
          },
        });
      } else {
        // For Instruction/Output/Workflow connections, just delete the unfinished connection
        this.editor.deleteShapes([connection.id]);
      }
    } else {
      // if we're not creating a new connection and we just let go, there must be bindings. If
      // not, let's interpret this as the user disconnecting the shape.
      if (!bindings.start || !bindings.end) {
        this.editor.deleteShapes([connection.id]);
      }
    }
  }

  onHandleDragCancel() {
    // if we cancel a drag part way through, we need to clear out our port UI state.
    updatePortState(this.editor, { hintingPort: null, eligiblePorts: null });
  }

  component(connection: ConnectionShape) {
    return <ConnectionShape connection={connection} />;
  }

  indicator(connection: ConnectionShape) {
    const { start, end } = getConnectionTerminals(this.editor, connection);
    return (
      <g className="ConnectionShapeIndicator">
        <path d={getConnectionPath(start, end)} strokeWidth={2.1} strokeLinecap="round" />
        <ConnectionCenterHandle connection={connection} center={Vec.Lrp(start, end, 0.5)} />
      </g>
    );
  }
}

// Main connection component that renders the SVG path
function ConnectionShape({ connection }: { connection: ConnectionShape }) {
  const editor = useEditor();
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Get the connection terminals
  const { start, end } = useValue('terminals', () => getConnectionTerminals(editor, connection), [editor, connection]);

  const { isInactive, isRealtime } = useValue(
    'connectionMeta',
    () => {
      const bindings = getConnectionBindings(editor, connection.id);
      const originShapeId = bindings.start?.toId;
      const targetShapeId = bindings.end?.toId;

      let inactive = false;
      let realtime = false;

      if (originShapeId) {
        const originShape = editor.getShape(originShapeId);
        if (originShape && editor.isShapeOfType<NodeShape>(originShape, 'node')) {
          const outputs = getNodeOutputPortInfo(editor, originShapeId);
          const output = outputs[bindings.start!.props.portId];
          inactive = output?.value === STOP_EXECUTION;
        }
      }

      // 实时转绘连线：任一端是 live-image，则视作实时转绘连接
      const startShape = originShapeId ? editor.getShape(originShapeId) : null;
      const endShape = targetShapeId ? editor.getShape(targetShapeId) : null;

      if (startShape?.type === 'live-image' || endShape?.type === 'live-image') {
        realtime = true;
      }

      return { isInactive: inactive, isRealtime: realtime };
    },
    [connection.id, editor],
  );

  const center = Vec.Lrp(start, end, 0.5);
  const rawLabel = (connection.props as any).label as string | undefined;
  const displayLabel = rawLabel && rawLabel.trim().length > 0 ? rawLabel.trim() : 'Double click prompt to edit';

  const handleLabelDoubleClick = useCallback(
    (e: React.MouseEvent<SVGTextElement>) => {
      editor.markEventAsHandled(e);
      e.stopPropagation();
      e.preventDefault();

      setEditValue(rawLabel || '');
      setIsEditing(true);
    },
    [rawLabel, editor],
  );

  const handleLabelPointerDown = useCallback((e: React.PointerEvent<SVGTextElement>) => {
    e.stopPropagation();
  }, []);

  const handleInputKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
        stopEventPropagation(e);
        e.currentTarget.blur();
      } else if (e.key === 'Escape') {
        stopEventPropagation(e);
        setIsEditing(false);
        setEditValue(rawLabel || '');
      }
    },
    [rawLabel],
  );

  const handleInputBlur = useCallback(() => {
    const trimmed = editValue.trim();
    const finalValue = trimmed.length > 0 ? trimmed : '';
    const prev = rawLabel || '';

    if (finalValue !== prev) {
      editor.updateShape<ConnectionShape>({
        id: connection.id,
        type: 'connection',
        props: {
          ...connection.props,
          label: finalValue,
        },
      });
    }

    setIsEditing(false);
  }, [editValue, rawLabel, connection.id, connection.props, editor]);

  // 当进入编辑模式时，聚焦 input
  useEffect(() => {
    if (isEditing) {
      // 使用 requestAnimationFrame 确保 DOM 已完全渲染
      const rafId = requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
          }
        });
      });
      return () => cancelAnimationFrame(rafId);
    }
  }, [isEditing]);

  return (
    <>
      <SVGContainer
        className={classNames(
          'ConnectionShape',
          isInactive && 'ConnectionShape_inactive',
          isRealtime && 'ConnectionShape_realtime',
        )}
      >
        <path d={getConnectionPath(start, end)} />
        {isRealtime && !isEditing && (
          <text
            x={center.x}
            y={center.y - 6}
            textAnchor="middle"
            dominantBaseline="central"
            style={{
              fontSize: 10,
              fill: '#4B5563',
              stroke: 'none',
              pointerEvents: 'all',
              cursor: 'text',
            }}
            onDoubleClick={handleLabelDoubleClick}
            onPointerDown={handleLabelPointerDown}
          >
            {displayLabel}
          </text>
        )}
        {isRealtime && isEditing && (
          <foreignObject
            x={center.x - 60}
            y={center.y - 16}
            width="120"
            height="20"
            style={{ pointerEvents: 'all' }}
          >
            <input
              ref={inputRef}
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleInputKeyDown}
              onBlur={handleInputBlur}
              onPointerDown={stopEventPropagation}
              style={{
                width: '100%',
                height: '100%',
                fontSize: 10,
                color: '#4B5563',
                background: 'white',
                border: '1px solid #CBD5E1',
                borderRadius: '2px',
                padding: '2px 4px',
                textAlign: 'center',
                outline: 'none',
                boxSizing: 'border-box',
              }}
              placeholder="输入提示词"
            />
          </foreignObject>
        )}
      </SVGContainer>
    </>
  );
}

// Center handle component that allows inserting nodes in the middle of connections
function ConnectionCenterHandle({ connection, center }: { connection: ConnectionShape; center: Vec }) {
  const editor = useEditor();

  // Only show the center handle when zoomed in, the connection is fully bound,
  // AND both ends are connected to NodeShape (not Instruction/Output/Workflow)
  const shouldShowCenterHandle = useValue(
    'shouldShowCenterHandle',
    () => {
      const bindings = getConnectionBindings(editor, connection);
      const isFullyBound = !!bindings.start && !!bindings.end;
      if (!isFullyBound) return false;

      // Check if both ends are NodeShape types
      const startShape = bindings.start ? editor.getShape(bindings.start.toId) : null;
      const endShape = bindings.end ? editor.getShape(bindings.end.toId) : null;

      const bothAreNodes =
        startShape &&
        editor.isShapeOfType<NodeShape>(startShape, 'node') &&
        endShape &&
        editor.isShapeOfType<NodeShape>(endShape, 'node');

      return editor.getZoomLevel() > 0.5 && bothAreNodes;
    },
    [editor, connection.id],
  );

  const plusR = CONNECTION_CENTER_HANDLE_SIZE_PX / 3 - 1;

  if (!shouldShowCenterHandle) return null;

  return (
    <g
      className="ConnectionCenterHandle"
      style={{
        transform: `translate(${center.x}px, ${center.y}px) scale(max(0.5, calc(1 / var(--tl-zoom))))`,
      }}
      onPointerDown={editor.markEventAsHandled}
      onClick={() => {
        insertNodeWithinConnection(editor, connection);
      }}
    >
      <circle className="ConnectionCenterHandle-hover" r={CONNECTION_CENTER_HANDLE_HOVER_SIZE_PX / 2} />
      <circle className="ConnectionCenterHandle-ring" r={CONNECTION_CENTER_HANDLE_SIZE_PX / 2} />
      <path className="ConnectionCenterHandle-icon" d={`M ${-plusR} 0 L ${plusR} 0 M 0 ${-plusR} L 0 ${plusR}`} />
    </g>
  );
}

// Calculate control points for smooth bezier curves
function getConnectionControlPoints(start: VecLike, end: VecLike): [Vec, Vec] {
  const distance = end.x - start.x;
  const adjustedDistance = Math.max(30, distance > 0 ? distance / 3 : clamp(Math.abs(distance) + 30, 0, 100));
  return [new Vec(start.x + adjustedDistance, start.y), new Vec(end.x - adjustedDistance, end.y)];
}

// Generate SVG path for the connection
function getConnectionPath(start: VecLike, end: VecLike) {
  const [cp1, cp2] = getConnectionControlPoints(start, end);
  return `M ${start.x} ${start.y} C ${cp1.x} ${cp1.y} ${cp2.x} ${cp2.y} ${end.x} ${end.y}`;
}

// Get the actual start and end points of a connection, considering its bindings
export function getConnectionTerminals(editor: Editor, connection: ConnectionShape) {
  let start, end;

  // if possible, set the start and end points based on the bindings
  const bindings = getConnectionBindings(editor, connection);
  const connectionTransform = editor.getShapePageTransform(connection);
  if (!connectionTransform) {
    // Fallback to shape props if transform is not available
    return { start: connection.props.start, end: connection.props.end };
  }
  const shapeTransform = Mat.Inverse(connectionTransform);
  if (bindings.start) {
    const inPageSpace = getConnectionBindingPositionInPageSpace(editor, bindings.start);
    if (inPageSpace) {
      start = Mat.applyToPoint(shapeTransform, inPageSpace);
    }
  }
  if (bindings.end) {
    const inPageSpace = getConnectionBindingPositionInPageSpace(editor, bindings.end);
    if (inPageSpace) {
      end = Mat.applyToPoint(shapeTransform, inPageSpace);
    }
  }

  // if we couldn't set the start and end points based on the bindings, use the values stored on
  // the shape itself
  if (!start) start = connection.props.start;
  if (!end) end = connection.props.end;

  return { start, end };
}
