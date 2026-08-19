import type { Expression } from "./schema";

/**
 * A Boolean expression, read from text and written back to it.
 *
 * A hand-written parser over a tiny grammar, in the same spirit as
 * `task-numeric`'s: there is no `eval`, no `Function`, no `RegExp` built from
 * author text, and no way to *name* a global, a property or a call target. The
 * grammar has variables, five connectives, two constants and brackets, and
 * nothing else can be written down — so `alert(1)` is not blocked, it is
 * unsayable.
 *
 * What is stored in the document is the tree, not the text. The form parses
 * what the author types and keeps the result; `format` writes a tree back out
 * when a form has to show one it did not just receive.
 */

/** Everything the author may type for each connective, longest first. */
const OPERATORS = {
  iff: ["<->", "<=>", "↔", "≡", "iff", "xnor"],
  implies: ["->", "=>", "→", "⊃", "implies"],
  or: ["||", "∨", "|", "+", "or"],
  xor: ["⊕", "^", "xor"],
  and: ["&&", "∧", "&", "·", "*", "and"],
  not: ["¬", "!", "~", "not"],
} as const;

/*
 * A `Map`, not an object. `"constructor" in {…}` is true through the
 * prototype chain, so an object here read `constructor`, `toString` and
 * `valueOf` as constants and handed back a cell with no value in it — from
 * author text, which is exactly the kind of name a variable might have.
 */
const CONSTANTS = new Map<string, boolean>([
  ["1", true],
  ["0", false],
  ["true", true],
  ["false", false],
  ["t", true],
  ["f", false],
  ["⊤", true],
  ["⊥", false],
]);

export type ParseResult =
  | { ok: true; value: Expression }
  | { ok: false; error: string };

type Token =
  | { kind: "op"; op: keyof typeof OPERATORS }
  | { kind: "open" }
  | { kind: "close" }
  | { kind: "name"; name: string }
  | { kind: "constant"; value: boolean };

/**
 * Text to tokens.
 *
 * A name that spells an operator is the operator, so a variable may not be
 * called `and` or `or`. That is a restriction worth having: `A and B` would
 * otherwise mean two different things depending on what the variables were.
 */
const tokenise = (source: string): Token[] | string => {
  const tokens: Token[] = [];
  let index = 0;

  const symbols = Object.entries(OPERATORS).flatMap(([op, spellings]) =>
    spellings
      .filter((token) => !/^[a-z]+$/.test(token))
      .map((token) => [token, op as keyof typeof OPERATORS] as const),
  );
  // Longest first, or `<->` would be read as `<` and then nothing.
  symbols.sort((a, b) => b[0].length - a[0].length);

  while (index < source.length) {
    const rest = source.slice(index);
    const char = source[index];

    if (/\s/.test(char)) {
      index += 1;
      continue;
    }
    if (char === "(") {
      tokens.push({ kind: "open" });
      index += 1;
      continue;
    }
    if (char === ")") {
      tokens.push({ kind: "close" });
      index += 1;
      continue;
    }

    const symbol = symbols.find(([token]) => rest.startsWith(token));
    if (symbol) {
      tokens.push({ kind: "op", op: symbol[1] });
      index += symbol[0].length;
      continue;
    }

    // A name: a letter, then letters, digits and underscores. `A1` and `x_2`
    // are variables; nothing here can produce a dot or a bracket call.
    const name = /^[\p{L}_][\p{L}\p{N}_]*/u.exec(rest);
    if (name) {
      const word = name[0];
      const lower = word.toLowerCase();
      const word_op = (
        Object.keys(OPERATORS) as Array<keyof typeof OPERATORS>
      ).find((key) => (OPERATORS[key] as readonly string[]).includes(lower));
      if (word_op) {
        tokens.push({ kind: "op", op: word_op });
      } else if (CONSTANTS.has(lower)) {
        tokens.push({ kind: "constant", value: CONSTANTS.get(lower) as boolean });
      } else {
        tokens.push({ kind: "name", name: word });
      }
      index += word.length;
      continue;
    }

    if (CONSTANTS.has(rest[0])) {
      tokens.push({ kind: "constant", value: CONSTANTS.get(rest[0]) as boolean });
      index += 1;
      continue;
    }

    return `“${char}” does not mean anything here.`;
  }

  return tokens;
};

/**
 * Tokens to a tree, by precedence: `iff` loosest, then `implies`, `or`, `xor`,
 * `and`, `not` tightest. The conventional order, so an expression copied out
 * of a textbook means what the textbook meant.
 */
export const parse = (source: string): ParseResult => {
  const tokens = tokenise(source);
  if (typeof tokens === "string") return { ok: false, error: tokens };
  if (tokens.length === 0) return { ok: false, error: "Write an expression." };

  let at = 0;
  const peek = (): Token | undefined => tokens[at];

  /* Thrown rather than returned: a parse error is one message from wherever it
     happened, and threading a result type through six mutually recursive
     functions buys nothing over catching it once. */
  const fail = (message: string): never => {
    throw new Error(message);
  };

  const binary = (
    op: keyof typeof OPERATORS,
    next: () => Expression,
    /** Right-associative for implication: `a -> b -> c` is `a -> (b -> c)`. */
    right = false,
  ): Expression => {
    let left = next();
    while (peek()?.kind === "op" && (peek() as { op: string }).op === op) {
      at += 1;
      const other = right ? binary(op, next, true) : next();
      left = { kind: op, left, right: other } as Expression;
    }
    return left;
  };

  const primary = (): Expression => {
    const token = peek();
    if (!token) return fail("The expression stops early.");

    if (token.kind === "open") {
      at += 1;
      const inner = iff();
      if (peek()?.kind !== "close") return fail("A bracket is not closed.");
      at += 1;
      return inner;
    }
    if (token.kind === "name") {
      at += 1;
      return { kind: "variable", name: token.name };
    }
    if (token.kind === "constant") {
      at += 1;
      return { kind: "constant", value: token.value };
    }
    if (token.kind === "close") return fail("A bracket closes nothing.");
    return fail("An operator has nothing to its left.");
  };

  const not = (): Expression => {
    const token = peek();
    if (token?.kind === "op" && token.op === "not") {
      at += 1;
      return { kind: "not", value: not() };
    }
    return primary();
  };

  const and = () => binary("and", not);
  const xor = () => binary("xor", and);
  const or = () => binary("or", xor);
  const implies = (): Expression => binary("implies", or, true);
  const iff = () => binary("iff", implies);

  try {
    const value = iff();
    if (at < tokens.length) {
      return { ok: false, error: "There is something left over at the end." };
    }
    return { ok: true, value };
  } catch (error) {
    return { ok: false, error: (error as Error).message };
  }
};

/** The connective as it is written back out and drawn in a heading. */
const SIGN: Record<string, string> = {
  and: "∧",
  or: "∨",
  xor: "⊕",
  implies: "→",
  iff: "↔",
};

const PRECEDENCE: Record<string, number> = {
  iff: 1,
  implies: 2,
  or: 3,
  xor: 4,
  and: 5,
  not: 6,
  variable: 7,
  constant: 7,
};

/**
 * A tree back to text, bracketed only where the shape needs it.
 *
 * `A ∧ B ∨ C` came from one tree and `A ∧ (B ∨ C)` from another, so the
 * brackets that survive are the ones that carry meaning — an author reading
 * their own expression back should see what they wrote, not every step of the
 * grammar.
 */
export const format = (expression: Expression): string => {
  const wrap = (child: Expression, minimum: number): string => {
    const text = format(child);
    return PRECEDENCE[child.kind] < minimum ? `(${text})` : text;
  };

  switch (expression.kind) {
    case "variable":
      return expression.name;
    case "constant":
      return expression.value ? "1" : "0";
    case "not":
      return `¬${wrap(expression.value, PRECEDENCE.not)}`;
    default: {
      const level = PRECEDENCE[expression.kind];
      const sign = SIGN[expression.kind];
      // Left-associative operators need no brackets on their own left; the
      // right side does, or `A ∧ (B ∧ C)` and `(A ∧ B) ∧ C` would print alike.
      return `${wrap(expression.left, level)} ${sign} ${wrap(
        expression.right,
        level + 1,
      )}`;
    }
  }
};

/** Every variable the expression names, in the order it first mentions them. */
export const variablesIn = (expression: Expression): string[] => {
  const found: string[] = [];
  const walk = (node: Expression) => {
    switch (node.kind) {
      case "variable":
        if (!found.includes(node.name)) found.push(node.name);
        return;
      case "constant":
        return;
      case "not":
        walk(node.value);
        return;
      default:
        walk(node.left);
        walk(node.right);
    }
  };
  walk(expression);
  return found;
};

/**
 * The expression's value for one assignment of the variables.
 *
 * A variable the row does not mention is `false` rather than an exception: the
 * rows are generated from the declared variables, so this can only be reached
 * by a hand-edited file, and a wrong answer beats a flow that stops.
 */
export const valueOf = (
  expression: Expression,
  inputs: Record<string, boolean>,
): boolean => {
  switch (expression.kind) {
    case "variable":
      // `Object.hasOwn`, for the same reason the constants are a `Map`: a
      // variable an author called `constructor` would otherwise read as
      // `Object.prototype.constructor`, which is truthy in every row.
      return Object.hasOwn(inputs, expression.name)
        ? inputs[expression.name]
        : false;
    case "constant":
      return expression.value;
    case "not":
      return !valueOf(expression.value, inputs);
    case "and":
      return valueOf(expression.left, inputs) && valueOf(expression.right, inputs);
    case "or":
      return valueOf(expression.left, inputs) || valueOf(expression.right, inputs);
    case "xor":
      return valueOf(expression.left, inputs) !== valueOf(expression.right, inputs);
    case "implies":
      return !valueOf(expression.left, inputs) || valueOf(expression.right, inputs);
    case "iff":
      return valueOf(expression.left, inputs) === valueOf(expression.right, inputs);
  }
};
