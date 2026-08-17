import { beforeEach, describe, expect, it } from "vitest";
import { clearBits } from "./registry";
import { doc, edge, node, registerTestBits } from "./test-utils";
import { parseFlow, validateFlow } from "./validate";

const valid = doc(
  [
    node("start", "test-start"),
    node("q", "test-task", { correct: "a" }),
    node("end", "test-end"),
  ],
  [edge("start", "q"), edge("q", "end")],
);

describe("parseFlow", () => {
  it("accepts a well-formed document", () => {
    const parsed = parseFlow(valid);
    expect(parsed.ok).toBe(true);
  });

  it("accepts JSON text", () => {
    const parsed = parseFlow(JSON.stringify(valid));
    expect(parsed.ok).toBe(true);
    if (parsed.ok) expect(parsed.value.meta.id).toBe("test-flow");
  });

  it("rejects text that is not JSON", () => {
    const parsed = parseFlow("{");
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) expect(parsed.error.code).toBe("INVALID_FLOW");
  });

  it("reports the path of a schema violation", () => {
    const parsed = parseFlow({ ...valid, nodes: [{ id: "a", type: "x" }] });
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) {
      expect(parsed.error.code).toBe("INVALID_FLOW");
      expect(parsed.error.diagnostics?.some((d) => d.path === "nodes.0.position")).toBe(true);
    }
  });

  it("does not look inside bit data", () => {
    // `nonsense` is not a registered bit, yet the envelope still parses: a host
    // without that bit package must be able to read and re-save the document.
    const parsed = parseFlow(
      doc([node("a", "nonsense", { whatever: true })], []),
    );
    expect(parsed.ok).toBe(true);
  });
});

describe("validateFlow", () => {
  beforeEach(registerTestBits);

  it("passes a well-formed flow", () => {
    expect(validateFlow(valid)).toEqual({ valid: true, diagnostics: [] });
  });

  it("reports duplicate node ids", () => {
    const broken = doc(
      [node("dup", "test-start"), node("dup", "test-end")],
      [edge("dup", "dup")],
    );
    expect(
      validateFlow(broken).diagnostics.some((d) => d.message.includes("Duplicate node id")),
    ).toBe(true);
  });

  it("reports an edge pointing at a missing node", () => {
    const broken = doc([node("start", "test-start")], [edge("start", "ghost")]);
    const { diagnostics } = validateFlow(broken);
    expect(diagnostics).toContainEqual({
      path: "edges.0.target",
      message: 'Edge ends at "ghost", which is not a node in this flow.',
    });
  });

  it("reports a condition referring to a missing node", () => {
    const broken = doc(
      [node("start", "test-start"), node("end", "test-end")],
      [
        edge("start", "end", {
          condition: {
            type: "compare",
            left: { kind: "result", nodeId: "ghost", path: "state" },
            op: "eq",
            right: "correct",
          },
        }),
      ],
    );
    expect(
      validateFlow(broken).diagnostics.some((d) =>
        d.message.includes('refers to node "ghost"'),
      ),
    ).toBe(true);
  });

  it("reports unknown bit types once a registry is populated", () => {
    const broken = doc([node("a", "no-such-bit")], []);
    expect(
      validateFlow(broken).diagnostics.some((d) =>
        d.message.includes('Unknown bit type "no-such-bit"'),
      ),
    ).toBe(true);
  });

  it("stays quiet about unknown types when no bit package is loaded", () => {
    clearBits();
    const document = doc([node("a", "no-such-bit")], []);
    expect(
      validateFlow(document).diagnostics.some((d) => d.message.includes("Unknown bit type")),
    ).toBe(false);
  });

  it("validates bit data against the bit's own schema, with the field path", () => {
    const broken = doc(
      [
        node("start", "test-start"),
        node("q", "test-task", {}),
        node("end", "test-end"),
      ],
      [edge("start", "q"), edge("q", "end")],
    );
    const { diagnostics } = validateFlow(broken);
    expect(diagnostics.some((d) => d.path === "nodes.1.data.correct")).toBe(true);
  });

  it("reports more than one possible starting point", () => {
    const broken = doc(
      [node("start", "test-start"), node("stray", "test-end")],
      [],
    );
    expect(
      validateFlow(broken).diagnostics.some((d) =>
        d.message.includes("possible starting points"),
      ),
    ).toBe(true);
  });

  it("reports a node the learner can never reach", () => {
    const broken = doc(
      [
        node("start", "test-start"),
        node("end", "test-end"),
        node("island", "test-content"),
        node("island2", "test-end"),
      ],
      [edge("start", "end"), edge("island", "island2"), edge("island2", "island")],
    );
    expect(
      validateFlow(broken).diagnostics.some((d) =>
        d.message.includes('Node "island" cannot be reached'),
      ),
    ).toBe(true);
  });

  it("reports a dead end that is not an end bit", () => {
    const broken = doc(
      [node("start", "test-start"), node("q", "test-task", { correct: "a" })],
      [edge("start", "q")],
    );
    expect(
      validateFlow(broken).diagnostics.some((d) =>
        d.message.includes("has no outgoing edge"),
      ),
    ).toBe(true);
  });

  it("reports an empty flow", () => {
    expect(validateFlow(doc([], [])).diagnostics).toEqual([
      { path: "nodes", message: "The flow has no nodes." },
    ]);
  });
});
