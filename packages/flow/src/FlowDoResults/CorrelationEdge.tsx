import { lerpColor } from "@bitflow/base";
import { CSSProperties, Fragment, memo } from "react";
import {
  EdgeProps,
  EdgeText,
  getBezierPath,
  getMarkerEnd,
  Position,
} from "react-flow-renderer";

const LeftOrRight = [Position.Left, Position.Right];

export const getCenter = ({
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition = Position.Bottom,
  targetPosition = Position.Top,
}: any): [number, number, number, number] => {
  const sourceIsLeftOrRight = LeftOrRight.includes(sourcePosition);
  const targetIsLeftOrRight = LeftOrRight.includes(targetPosition);

  // we expect flows to be horizontal or vertical (all handles left or right respectively top or bottom)
  // a mixed edge is when one the source is on the left and the target is on the top for example.
  const mixedEdge =
    (sourceIsLeftOrRight && !targetIsLeftOrRight) ||
    (targetIsLeftOrRight && !sourceIsLeftOrRight);

  if (mixedEdge) {
    const xOffset = sourceIsLeftOrRight ? Math.abs(targetX - sourceX) : 0;
    const centerX = sourceX > targetX ? sourceX - xOffset : sourceX + xOffset;

    const yOffset = sourceIsLeftOrRight ? 0 : Math.abs(targetY - sourceY);
    const centerY = sourceY < targetY ? sourceY + yOffset : sourceY - yOffset;

    return [centerX, centerY, xOffset, yOffset];
  }

  const xOffset = Math.abs(targetX - sourceX) / 2;
  const centerX = targetX < sourceX ? targetX + xOffset : targetX - xOffset;

  const yOffset = Math.abs(targetY - sourceY) / 2;
  const centerY = targetY < sourceY ? targetY + yOffset : targetY - yOffset;

  return [centerX, centerY, xOffset, yOffset];
};

export type CorrelationEdgeProps = EdgeProps;

export const CorrelationEdge = memo(
  ({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition = Position.Bottom,
    targetPosition = Position.Top,
    markerEndId,
    data,
  }: EdgeProps & {
    data: {
      correlation: number;
    };
  }) => {
    const { correlation } = data;
    const [centerX, centerY] = getCenter({
      sourceX,
      sourceY,
      targetX,
      targetY,
      sourcePosition,
      targetPosition,
    });
    const path = getBezierPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
    });

    let style: CSSProperties = {
      stroke: "#9AA5B1",
    };
    let textStyle: CSSProperties = {
      color: "#1f2933",
    };

    if (!correlation) {
      style = {
        stroke: "transparent",
      };
    } else if (correlation < 0) {
      style = {
        stroke: lerpColor("#ffcccc", "#ff4c4c", correlation),
      };
    } else if (correlation > 0) {
      style = {
        stroke: lerpColor("#f2f7ff", "#4188ff", correlation),
      };
    }

    const text = correlation ? (
      <EdgeText x={centerX} y={centerY} label={correlation} style={textStyle} />
    ) : null;

    const markerEnd = getMarkerEnd(undefined, markerEndId);

    return (
      <Fragment>
        <path
          style={{
            stroke: "#9aa5b1",
            ...style,
          }}
          d={path}
          className="react-flow__edge-path"
          markerEnd={markerEnd}
        />
        {text}
      </Fragment>
    );
  }
);
