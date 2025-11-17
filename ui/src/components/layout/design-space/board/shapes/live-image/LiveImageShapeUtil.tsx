/* eslint-disable react-hooks/rules-of-hooks */
import {
  Geometry2d,
  getDefaultColorTheme,
  Group2d,
  Rectangle2d,
  resizeBox,
  ShapeUtil,
  SVGContainer,
  TLBaseShape,
  TLGroupShape,
  TLResizeInfo,
  TLShape,
  TLShapeId,
  toDomPrecision,
  useEditor,
  useIsDarkMode,
} from 'tldraw';

import { useLiveImage } from '../../hooks/useLiveImage';
import { GenericPort } from '../ports/GenericPort';
import { getLiveImagePorts } from '../ports/liveImagePorts';
import { FrameHeading } from './FrameHeading';

export type LiveImageShape = TLBaseShape<
  'live-image',
  {
    w: number;
    h: number;
    name: string;
    overlayResult?: boolean;
  }
>;

export class LiveImageShapeUtil extends ShapeUtil<LiveImageShape> {
  static type = 'live-image' as any;

  override canBind = () => true;
  override canEdit = () => true;
  override isAspectRatioLocked = () => true;

  getDefaultProps() {
    return {
      w: 512,
      h: 512,
      name: '',
    };
  }

  override getGeometry(shape: LiveImageShape): Geometry2d {
    return new Group2d({
      children: [
        new Rectangle2d({
          width: shape.props.w,
          height: shape.props.h,
          isFilled: false,
        }),
      ],
    });
  }

  override canReceiveNewChildrenOfType = (shape: TLShape, _type: TLShape['type']) => {
    return !shape.isLocked;
  };

  providesBackgroundForChildren(): boolean {
    return true;
  }

  canDropShapes = (shape: LiveImageShape, _shapes: TLShape[]): boolean => {
    return !shape.isLocked;
  };

  override onDragShapesOver = (frame: LiveImageShape, shapes: TLShape[]): { shouldHint: boolean } => {
    if (shapes.some((child) => child.type === 'live-image')) {
      return { shouldHint: false };
    }
    if (!shapes.every((child) => child.parentId === frame.id)) {
      this.editor.reparentShapes(
        shapes.map((shape) => shape.id),
        frame.id,
      );
      return { shouldHint: true };
    }
    return { shouldHint: false };
  };

  override onDragShapesOut = (_shape: LiveImageShape, shapes: TLShape[]): void => {
    const parent = this.editor.getShape(_shape.parentId);
    const isInGroup = parent && this.editor.isShapeOfType<TLGroupShape>(parent, 'group');
    if (isInGroup) {
      this.editor.reparentShapes(shapes, parent.id);
    } else {
      this.editor.reparentShapes(shapes, this.editor.getCurrentPageId());
    }
  };

  override onResizeEnd(shape: LiveImageShape) {
    const bounds = this.editor.getShapePageBounds(shape)!;
    const children = this.editor.getSortedChildIdsForParent(shape.id);

    const shapesToReparent: TLShapeId[] = [];

    for (const childId of children) {
      const childBounds = this.editor.getShapePageBounds(childId)!;
      if (!bounds.includes(childBounds)) {
        shapesToReparent.push(childId);
      }
    }

    if (shapesToReparent.length > 0) {
      this.editor.reparentShapes(shapesToReparent, this.editor.getCurrentPageId());
    }
  }

  override onResize(shape: LiveImageShape, info: TLResizeInfo<LiveImageShape>) {
    return resizeBox(shape, info);
  }

  indicator(shape: LiveImageShape) {
    const bounds = this.editor.getShapeGeometry(shape).bounds;
    const ports = Object.values(getLiveImagePorts(this.editor, shape));

    return (
      <>
        <rect
          width={toDomPrecision(bounds.width)}
          height={toDomPrecision(bounds.height)}
          className={`tl-frame-indicator`}
        />
        {ports.map((port) => (
          <circle key={port.id} cx={port.x} cy={port.y} r={8} />
        ))}
      </>
    );
  }

  override component(shape: LiveImageShape) {
    const editor = useEditor();

    useLiveImage(shape.id);

    const bounds = this.editor.getShapeGeometry(shape).bounds;

    const theme = getDefaultColorTheme({ isDarkMode: useIsDarkMode() });

    return (
      <>
        <SVGContainer>
          <rect
            className={'tl-frame__body'}
            width={bounds.width}
            height={bounds.height}
            fill={theme.solid}
            stroke={theme.text}
          />
        </SVGContainer>
        <FrameHeading id={shape.id} name={shape.props.name} width={bounds.width} height={bounds.height} />

        {/* Output Port - 用于连接到 Output / Workflow */}
        <GenericPort shapeId={shape.id} portId="output" />
      </>
    );
  }
}
