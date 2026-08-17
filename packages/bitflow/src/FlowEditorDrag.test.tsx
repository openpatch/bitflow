import { act, render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Dragging a step on the canvas.
 *
 * React Flow moves a node by emitting position changes as the pointer moves;
 * the canvas has to accept them or the node sits still until it is released.
 * jsdom has no layout, so React Flow cannot run a real drag here — this stands
 * in for the canvas and calls the two handlers a drag calls, which is exactly
 * the wiring that was missing.
 */
let canvasProps: Record<string, any> = {};

vi.mock("@xyflow/react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@xyflow/react")>();
  return {
    ...actual,
    ReactFlow: (props: Record<string, any>) => {
      canvasProps = props;
      return <div data-testid="canvas" />;
    },
  };
});

const { FlowEditor } = await import("./FlowEditor");
const { registerTestBits, simpleFlow } = await import("./test-utils");

describe("dragging a step", () => {
  beforeEach(() => {
    registerTestBits();
    canvasProps = {};
  });

  const setup = () => {
    const onEdit = vi.fn();
    render(<FlowEditor flow={simpleFlow} locale="en" onEdit={onEdit} />);
    return { onEdit };
  };

  const positionOf = (id: string) =>
    canvasProps.nodes.find((n: any) => n.id === id).position;

  /** React Flow calls these from event handlers; `act` is what React needs. */
  const drag = (position: { x: number; y: number }) =>
    act(() =>
      canvasProps.onNodesChange([
        { id: "q", type: "position", position, dragging: true },
      ]),
    );

  const drop = (position: { x: number; y: number }) =>
    act(() => canvasProps.onNodeDragStop(null, { id: "q", position }));

  it("moves the node while the pointer is still down", () => {
    setup();
    expect(positionOf("q")).toEqual({ x: 0, y: 0 });

    drag({ x: 60, y: 40 });

    expect(positionOf("q")).toEqual({ x: 60, y: 40 });
  });

  it("writes nothing to the document mid-drag", () => {
    const { onEdit } = setup();

    for (const y of [10, 20, 30, 40]) drag({ x: 0, y });

    // Otherwise a single drag would write the file — and add an undo step —
    // dozens of times a second.
    expect(onEdit).not.toHaveBeenCalled();
  });

  it("writes exactly one edit when the drag ends", () => {
    const { onEdit } = setup();

    drag({ x: 60, y: 40 });
    drop({ x: 60, y: 40 });

    expect(onEdit).toHaveBeenCalledOnce();
    const document = onEdit.mock.calls[0][0];
    expect(document.nodes.find((n: any) => n.id === "q").position).toEqual({
      x: 60,
      y: 40,
    });
  });

  it("follows the document when it changes underneath", () => {
    const { onEdit } = setup();

    drag({ x: 999, y: 999 });
    drop({ x: 60, y: 40 });

    // The committed position wins over whatever the canvas was showing.
    expect(positionOf("q")).toEqual({ x: 60, y: 40 });
    expect(onEdit).toHaveBeenCalledOnce();
  });
});
