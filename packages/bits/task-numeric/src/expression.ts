/**
 * A deliberately small arithmetic language, parsed by hand and evaluated over
 * its own syntax tree.
 *
 * Nothing here reaches `eval`, `Function`, `new RegExp` on learner text, or a
 * network. A `.bitflow` file can come from anywhere and the text in the box
 * comes from whoever is sitting at the keyboard, so the only safe reading of
 * either is one that cannot express anything but arithmetic. What the grammar
 * does not mention cannot be written:
 *
 *     expression := term (("+" | "-") term)*
 *     term       := power (("*" | "/") power)*
 *     power      := unary ("^" power)?            right-associative
 *     unary      := ("+" | "-") unary | primary
 *     primary    := number | constant | call | "(" expression ")"
 *     call       := name "(" expression ("," expression)* ")"
 *
 * There is no variable, no assignment, no property access and no way to name
 * anything the allow-lists below do not already name.
 */

/** Longer than any answer to a question, and short enough to bound the parse. */
export const MAX_LENGTH = 200;

/**
 * The functions a learner may use. `log` is base ten and `ln` is natural,
 * which is the school convention; `log2` is spelled out because guessing
 * between the two is how a right answer becomes a wrong one.
 *
 * Trigonometry works in radians, as `Math` does. An author wanting degrees
 * writes the conversion into the expected value.
 */
export const FUNCTIONS: Record<
  string,
  { arity: number | "many"; apply: (args: number[]) => number }
> = {
  sqrt: { arity: 1, apply: ([x]) => Math.sqrt(x) },
  abs: { arity: 1, apply: ([x]) => Math.abs(x) },
  exp: { arity: 1, apply: ([x]) => Math.exp(x) },
  ln: { arity: 1, apply: ([x]) => Math.log(x) },
  log: { arity: 1, apply: ([x]) => Math.log10(x) },
  log2: { arity: 1, apply: ([x]) => Math.log2(x) },
  sin: { arity: 1, apply: ([x]) => Math.sin(x) },
  cos: { arity: 1, apply: ([x]) => Math.cos(x) },
  tan: { arity: 1, apply: ([x]) => Math.tan(x) },
  asin: { arity: 1, apply: ([x]) => Math.asin(x) },
  acos: { arity: 1, apply: ([x]) => Math.acos(x) },
  atan: { arity: 1, apply: ([x]) => Math.atan(x) },
  round: { arity: 1, apply: ([x]) => Math.round(x) },
  floor: { arity: 1, apply: ([x]) => Math.floor(x) },
  ceil: { arity: 1, apply: ([x]) => Math.ceil(x) },
  min: { arity: "many", apply: (args) => Math.min(...args) },
  max: { arity: "many", apply: (args) => Math.max(...args) },
};

export const CONSTANTS: Record<string, number> = {
  pi: Math.PI,
  "π": Math.PI,
  tau: Math.PI * 2,
  e: Math.E,
};

/**
 * How a decimal point may be written.
 *
 * `both` reads a comma as a decimal point, which is what a learner taught in
 * German or French will type. No mode accepts a thousands separator, in any
 * shape: `1,500` cannot mean one and a half and fifteen hundred at once, and a
 * task that silently picks one of those readings is worse than one that says
 * it does not understand.
 */
export type DecimalSeparator = "point" | "comma" | "both";

export type ParseOptions = {
  decimalSeparator?: DecimalSeparator;
  /**
   * Whether anything beyond a single signed number is allowed. Off, `3/4` is
   * refused rather than quietly worked out — "give it as a decimal" is a real
   * question, and answering it with the division is dodging it.
   */
  allowExpression?: boolean;
};

export type ParseFailure =
  | "empty"
  | "tooLong"
  | "syntax"
  | "unknownName"
  | "arity"
  | "expressionNotAllowed"
  | "notFinite";

export type ParseResult =
  | { ok: true; value: number; rest: string }
  | { ok: false; error: ParseFailure; rest: string };

// --- tokens -----------------------------------------------------------------

type Token =
  | { kind: "number"; value: number; at: number }
  | { kind: "name"; text: string; at: number }
  | { kind: "operator"; text: "+" | "-" | "*" | "/" | "^"; at: number }
  | { kind: "punctuation"; text: "(" | ")" | ","; at: number };

/**
 * Characters that mean an operator but are not the ASCII one.
 *
 * They arrive by copy and paste — from the question itself, from a textbook,
 * from a spreadsheet — and refusing them teaches nothing about arithmetic.
 */
const OPERATOR_ALIASES: Record<string, "+" | "-" | "*" | "/" | "^"> = {
  "−": "-", // minus sign
  "–": "-", // en dash
  "×": "*", // multiplication sign
  "·": "*", // middle dot
  "•": "*", // bullet
  "÷": "/", // division sign
  "∕": "/", // division slash
};

const isDigit = (character: string) => character >= "0" && character <= "9";

/** Letters and the few symbols a constant is spelled with. */
const isNameStart = (character: string) =>
  /[A-Za-zπ]/.test(character);

const isNameRest = (character: string) => /[A-Za-z0-9π]/.test(character);

/**
 * Reads tokens until it meets something that is not part of an expression.
 *
 * Stopping rather than failing is what lets a unit follow a number: `9.81 m/s`
 * tokenises as one number and then stops at `m`, and the caller takes the rest
 * of the string as the unit. A name that *is* known — `pi`, `sqrt` — is a
 * token, so `2*pi` is one expression and not a number with `*pi` written after
 * it.
 */
const tokenize = (
  source: string,
  options: Required<ParseOptions>,
): { tokens: Token[]; stopped: number } => {
  const tokens: Token[] = [];
  let index = 0;

  const commaIsDecimal =
    options.decimalSeparator === "comma" || options.decimalSeparator === "both";
  const pointIsDecimal =
    options.decimalSeparator === "point" || options.decimalSeparator === "both";

  while (index < source.length) {
    const character = source[index];

    if (/\s/.test(character)) {
      index++;
      continue;
    }

    // `**` is how a power is written in several languages a learner may have
    // met; it is the same operator, and it is looked for before `*` so it is
    // not read as two multiplications.
    if (source.startsWith("**", index)) {
      tokens.push({ kind: "operator", text: "^", at: index });
      index += 2;
      continue;
    }
    const operator = OPERATOR_ALIASES[character] ?? character;
    if (
      operator === "+" ||
      operator === "-" ||
      operator === "*" ||
      operator === "/" ||
      operator === "^"
    ) {
      tokens.push({ kind: "operator", text: operator, at: index });
      index++;
      continue;
    }
    if (character === "(" || character === ")") {
      tokens.push({ kind: "punctuation", text: character, at: index });
      index++;
      continue;
    }
    // A comma that is not inside a number separates a function's arguments.
    // The number reader below only swallows one when a digit follows it
    // immediately, so `max(1, 5)` works even where `1,5` means one and a half
    // — and `max(1,5)` is the genuinely ambiguous case, which is why `;` is
    // accepted as a separator too.
    if (character === ",") {
      tokens.push({ kind: "punctuation", text: ",", at: index });
      index++;
      continue;
    }
    if (character === ";") {
      tokens.push({ kind: "punctuation", text: ",", at: index });
      index++;
      continue;
    }

    const startsNumber =
      isDigit(character) ||
      (((character === "." && pointIsDecimal) ||
        (character === "," && commaIsDecimal)) &&
        isDigit(source[index + 1] ?? ""));

    if (startsNumber) {
      const at = index;
      let digits = "";
      let seenSeparator = false;
      while (index < source.length) {
        const next = source[index];
        if (isDigit(next)) {
          digits += next;
          index++;
          continue;
        }
        const isSeparator =
          ((next === "." && pointIsDecimal) || (next === "," && commaIsDecimal)) &&
          // Only when a digit follows it. `1,` at the end of `max(1, 5)` is
          // punctuation, not the start of a fraction nobody wrote.
          isDigit(source[index + 1] ?? "");
        // A second separator ends the number rather than joining it, so
        // `1.2.3` fails as syntax instead of parsing as `1.23`.
        if (isSeparator && !seenSeparator) {
          seenSeparator = true;
          digits += ".";
          index++;
          continue;
        }
        break;
      }
      // Scientific notation, but only where an exponent can actually follow:
      // otherwise the `e` of `12 elephants` would be eaten.
      const exponent = /^[eE][+-]?\d+/.exec(source.slice(index));
      if (exponent && !isNameRest(source[index + exponent[0].length] ?? "")) {
        digits += exponent[0];
        index += exponent[0].length;
      }
      tokens.push({ kind: "number", value: Number(digits), at });
      continue;
    }

    if (isNameStart(character)) {
      const at = index;
      let name = "";
      while (index < source.length && isNameRest(source[index])) {
        name += source[index];
        index++;
      }
      // A function name only counts as one when a `(` follows it. Without
      // that rule `5 min` would tokenise as a number and the `min` function,
      // and five minutes would be a syntax error rather than a quantity.
      const opensCall =
        name in FUNCTIONS && /^\s*\(/.test(source.slice(index));
      const isConstant =
        name in CONSTANTS || name.toLowerCase() in CONSTANTS;
      if (!opensCall && !isConstant) {
        // Not part of the arithmetic. Hand the whole name back to the caller,
        // which is how `5 kg` keeps its `kg`.
        return { tokens, stopped: at };
      }
      tokens.push({ kind: "name", text: name, at });
      continue;
    }

    return { tokens, stopped: index };
  }

  return { tokens, stopped: source.length };
};

// --- parser -----------------------------------------------------------------

class ParseError extends Error {
  constructor(readonly failure: ParseFailure) {
    super(failure);
  }
}

/**
 * Recursive descent over the token list, evaluating as it goes.
 *
 * There is no tree to keep: every production returns a number, which is all
 * the caller wants and leaves nothing lying around that could be interpreted
 * a second time.
 */
class Parser {
  private position = 0;

  constructor(private readonly tokens: Token[]) {}

  /** How far into the source the unparsed remainder starts. */
  get consumedUpTo(): number | undefined {
    return this.tokens[this.position]?.at;
  }

  private peek(): Token | undefined {
    return this.tokens[this.position];
  }

  private eatOperator(...texts: string[]): string | undefined {
    const token = this.peek();
    if (token?.kind === "operator" && texts.includes(token.text)) {
      this.position++;
      return token.text;
    }
    return undefined;
  }

  private eatPunctuation(text: "(" | ")" | ","): boolean {
    const token = this.peek();
    if (token?.kind === "punctuation" && token.text === text) {
      this.position++;
      return true;
    }
    return false;
  }

  expression(): number {
    let value = this.term();
    for (;;) {
      const operator = this.eatOperator("+", "-");
      if (!operator) return value;
      const right = this.term();
      value = operator === "+" ? value + right : value - right;
    }
  }

  private term(): number {
    let value = this.unary();
    for (;;) {
      const operator = this.eatOperator("*", "/");
      if (!operator) return value;
      const right = this.unary();
      value = operator === "*" ? value * right : value / right;
    }
  }

  /**
   * A sign binds *looser* than a power, so `-2^2` is −4 rather than 4.
   *
   * That is the convention everywhere the notation is used — on paper, in a
   * textbook and in a spreadsheet — and it is the reading a learner will have
   * been taught. Putting the sign inside the power instead is the arrangement
   * that silently turns a right answer into a wrong one.
   */
  private unary(): number {
    const operator = this.eatOperator("+", "-");
    if (operator) {
      const value = this.unary();
      return operator === "-" ? -value : value;
    }
    return this.power();
  }

  private power(): number {
    const base = this.primary();
    // Right-associative, so `2^3^2` is 512 the way it is written on paper, and
    // the exponent may carry its own sign: `2^-3`.
    if (this.eatOperator("^")) return base ** this.unary();
    return base;
  }

  private primary(): number {
    const token = this.peek();
    if (!token) throw new ParseError("syntax");

    if (token.kind === "number") {
      this.position++;
      return token.value;
    }

    if (token.kind === "punctuation" && token.text === "(") {
      this.position++;
      const value = this.expression();
      if (!this.eatPunctuation(")")) throw new ParseError("syntax");
      return value;
    }

    if (token.kind === "name") {
      this.position++;
      const call = FUNCTIONS[token.text];
      if (call) {
        if (!this.eatPunctuation("(")) throw new ParseError("syntax");
        const args = [this.expression()];
        while (this.eatPunctuation(",")) args.push(this.expression());
        if (!this.eatPunctuation(")")) throw new ParseError("syntax");
        if (call.arity !== "many" && args.length !== call.arity) {
          throw new ParseError("arity");
        }
        return call.apply(args);
      }
      const constant =
        CONSTANTS[token.text] ?? CONSTANTS[token.text.toLowerCase()];
      if (constant !== undefined) return constant;
      throw new ParseError("unknownName");
    }

    throw new ParseError("syntax");
  }
}

/**
 * Reads the leading arithmetic of `source` and hands back what it did not use.
 *
 * The remainder is the unit, when there is one — `parseQuantity` is the thing
 * most callers want, and this is the half of it that does the arithmetic.
 */
export const parseExpression = (
  source: string,
  options: ParseOptions = {},
): ParseResult => {
  const settings: Required<ParseOptions> = {
    decimalSeparator: options.decimalSeparator ?? "both",
    allowExpression: options.allowExpression ?? true,
  };

  if (source.length > MAX_LENGTH) return { ok: false, error: "tooLong", rest: "" };
  if (source.trim() === "") return { ok: false, error: "empty", rest: "" };

  const { tokens, stopped } = tokenize(source, settings);
  if (tokens.length === 0) return { ok: false, error: "syntax", rest: source.trim() };

  if (!settings.allowExpression) {
    // A plain number, with at most a sign in front of it. Anything else is
    // arithmetic the learner was asked to do rather than to write down.
    const shape = tokens.map((token) => token.kind).join(" ");
    const first = tokens[0];
    const signed =
      first.kind === "operator" && (first.text === "+" || first.text === "-");
    if (!(shape === "number" || (signed && shape === "operator number"))) {
      return { ok: false, error: "expressionNotAllowed", rest: "" };
    }
  }

  const parser = new Parser(tokens);
  let value: number;
  try {
    value = parser.expression();
  } catch (error) {
    if (error instanceof ParseError) {
      return { ok: false, error: error.failure, rest: "" };
    }
    throw error;
  }

  // Tokens left over mean the expression ended in the middle of itself —
  // `2 + ) 3`. A unit is text the tokenizer never turned into a token at all.
  const leftover = parser.consumedUpTo;
  if (leftover !== undefined) return { ok: false, error: "syntax", rest: "" };

  if (!Number.isFinite(value)) return { ok: false, error: "notFinite", rest: "" };

  const rest = source.slice(stopped).trim();
  // No unit begins with a digit or a decimal point. A remainder that does is
  // the tail of a number the grammar could not read — `0.75` where the author
  // said commas only, or `5 5` — and calling that a unit would mark somebody
  // against the `0` in front of it.
  if (/^[\d.,]/.test(rest)) return { ok: false, error: "syntax", rest: "" };

  return { ok: true, value, rest };
};

// --- units ------------------------------------------------------------------

const SUPERSCRIPTS: Record<string, string> = {
  "¹": "1",
  "²": "2",
  "³": "3",
  "⁴": "4",
  "⁵": "5",
  "⁶": "6",
  "⁷": "7",
  "⁸": "8",
  "⁹": "9",
  "⁰": "0",
  "⁻": "-",
};

/**
 * One spelling for units that mean the same thing.
 *
 * Case is kept, because in units it carries meaning — `mm` and `Mm` differ by
 * a factor of a billion, and a task that shrugs at that is not teaching units.
 * An author who wants to be gentler adds the spelling to the accepted list.
 *
 * What is folded away is only notation: the space in `N m`, the superscript in
 * `m/s²`, the two ways of writing micro, and the several multiplication signs.
 */
export const canonicalUnit = (unit: string): string => {
  let canonical = unit.trim();
  canonical = canonical.replace(/\*\*/g, "^");
  canonical = canonical.replace(
    /[¹²³⁰⁴-⁹⁻]+/g,
    (run) => `^${[...run].map((c) => SUPERSCRIPTS[c] ?? c).join("")}`,
  );
  canonical = canonical.replace(/[·•×]/g, "*");
  canonical = canonical.replace(/[∕]/g, "/");
  canonical = canonical.replace(/µ/g, "μ"); // micro sign → greek mu
  canonical = canonical.replace(/Ω/g, "Ω"); // ohm sign → greek omega
  // Every remaining space is decoration: `N m`, `N*m` and `Nm` are one unit.
  return canonical.replace(/[\s*]+/g, "");
};

export type Quantity = {
  value: number;
  /** As the learner wrote it, for the report. Empty when none was given. */
  unit: string;
};

export type QuantityResult =
  | ({ ok: true } & Quantity)
  | { ok: false; error: ParseFailure };

/** A number or expression, optionally followed by a unit. */
export const parseQuantity = (
  source: string,
  options: ParseOptions = {},
): QuantityResult => {
  const parsed = parseExpression(source, options);
  if (!parsed.ok) return { ok: false, error: parsed.error };
  return { ok: true, value: parsed.value, unit: parsed.rest };
};
