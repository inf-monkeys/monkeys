/**
 * Generic Port component that works with Instruction, Output, Workflow, and Node shapes
 */
import classNames from 'classnames';
import { TLShapeId, useEditor, useValue } from 'tldraw';
import { getNodePorts } from '../../workflow-examples/src/nodes/nodePorts';
import { NodeShape } from '../../workflow-examples/src/nodes/NodeShapeUtil';
import { PortId } from '../../workflow-examples/src/ports/Port';
import { portState } from '../../workflow-examples/src/ports/portState';
import { getShapePortConnections } from './portConnections';
import { getShapePorts } from './shapePorts';

/**
 * Generic Port component that supports both Node shapes and custom shapes
 */
export function GenericPort({ shapeId, portId }: { shapeId: TLShapeId; portId: PortId }) {
  const editor = useEditor();

  // Get the port from either node definition or custom shape definition
  const port = useValue(
    'port',
    () => {
      const shape = editor.getShape(shapeId);
      if (!shape) return null;

      // Try to get port from NodeShape
      if (editor.isShapeOfType<NodeShape>(shape, 'node')) {
        return getNodePorts(editor, shape)?.[portId];
      }

      // Try to get port from custom shapes (instruction, output, workflow)
      if (shape.type === 'instruction' || shape.type === 'output' || shape.type === 'workflow') {
        return getShapePorts(editor, shape as any)?.[portId];
      }

      return null;
    },
    [shapeId, portId, editor]
  );

  if (!port) {
    console.error(`Port ${portId} not found on shape ${shapeId}`);
    return null; // Return null instead of throwing to avoid breaking the UI
  }

  // isHinting is true if the user is currently dragging a connection to this port
  const isHinting = useValue(
    'isHinting',
    () => {
      const { hintingPort } = portState.get(editor);
      return hintingPort && hintingPort.portId === portId && hintingPort.shapeId === shapeId;
    },
    [editor, shapeId, portId]
  );

  // isEligible is true if the user is currently dragging a connection, and this port is eligible
  const isEligible = useValue(
    'isEligible',
    () => {
      const { eligiblePorts } = portState.get(editor);
      if (!eligiblePorts) return false;
      if (eligiblePorts.terminal !== port.terminal) return false;
      if (eligiblePorts.excludeNodes?.has(shapeId)) return false;

      if (port.terminal === 'end') {
        // End ports can only have one connection - use generic connection getter
        const connections = getShapePortConnections(editor, shapeId);
        return !connections.some((c) => c.ownPortId === portId);
      }

      return true;
    },
    [editor, shapeId, port.terminal, portId]
  );

  // Port 大小为 12px，端口坐标 (x, y) 是中心点，需要转换为左上角
  const PORT_SIZE = 12;
  const PORT_RADIUS = PORT_SIZE / 2;

  return (
    <div
      className={classNames(
        `Port Port_${port.terminal}`,
        isHinting ? 'Port_hinting' : isEligible ? 'Port_eligible' : undefined
      )}
      style={{
        // 设置端口位置，使 (x, y) 对应端口中心
        top: `${port.y - PORT_RADIUS}px`,
        left: `${port.x - PORT_RADIUS}px`,
        right: 'auto', // 覆盖 CSS 的 right 设置
      }}
      onPointerDown={() => {
        editor.setCurrentTool('select.pointing_port', {
          shapeId,
          portId,
          terminal: port.terminal,
        });
      }}
    />
  );
}

