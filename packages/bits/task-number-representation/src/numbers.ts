/**
 * Reading and writing a value in a representation.
 *
 * A deliberately small grammar, hand-parsed: digits of one base, an optional
 * base prefix, an optional minus where a minus can mean anything, and groups
 * separated by spaces. No `eval`, no `Function`, no `parseInt` — which reads
 * `"12nonsense"` as twelve and `"0x10"` as sixteen wherever it is handed one —
 * and no request anywhere. What cannot be spelled in this grammar has no
 * meaning here at all.
 *
 * A value is a *list* of integers rather than one, because a piece of text is
 * one integer per character: "HI" in 8-bit binary is two groups, and the
 * question "write HI in ASCII" is the same question as "write 42 in binary"
 * with two answers instead of one.
 *
 * `bigint` throughout: a 64-bit pattern is a perfectly ordinary thing to ask
 * about, and `Number` stops being exact eleven bits before that.
 */

export const REPRESENTATIONS = [
  "decimal",
  "binary",
  "octal",
  "hex",
  "text",
] as const;
export type Representation = (typeof REPRESENTATIONS)[number];

export const RADIX: Record<Exclude<Representation, "text">, number> = {
  binary: 2,
  octal: 8,
  decimal: 10,
  hex: 16,
};

const PREFIX: Record<string, string[]> = {
  binary: ["0b"],
  octal: ["0o"],
  hex: ["0x"],
};

const DIGITS = "0123456789abcdef";

export type ParseOptions = {
  /** Bits the value is held in. `0` means it is not held in anything. */
  bitWidth: number;
  /** Whether the top bit is a sign, read as two's complement. */
  signed: boolean;
  allowPrefix: boolean;
  allowSeparators: boolean;
  /** Whether every digit of the width has to be written, leading zeros and all. */
  requireFullWidth: boolean;
};

/** Why something could not be read. Each is shown to the learner as it stands. */
export const READ_FAILURES = [
  "empty",
  "badDigit",
  "negative",
  "tooWide",
  "notFullWidth",
] as const;
export type ReadFailure = (typeof READ_FAILURES)[number];

export type Reading =
  | { ok: true; values: bigint[] }
  | { ok: false; reason: ReadFailure };

const pow2 = (bits: number): bigint => 1n << BigInt(bits);

/**
 * How many digits of a base it takes to write every pattern of `bitWidth` bits:
 * eight for binary, three for octal, two for hex.
 */
export const digitsNeeded = (
  bitWidth: number,
  representation: Representation,
): number => {
  if (bitWidth <= 0 || representation === "decimal" || representation === "text") {
    return 0;
  }
  const perDigit = Math.log2(RADIX[representation]);
  return Math.ceil(bitWidth / perDigit);
};

/** The values a width can hold, as an inclusive range. */
export const rangeOf = (
  bitWidth: number,
  signed: boolean,
): { low: bigint; high: bigint } | undefined => {
  if (bitWidth <= 0) return undefined;
  return signed
    ? { low: -pow2(bitWidth - 1), high: pow2(bitWidth - 1) - 1n }
    : { low: 0n, high: pow2(bitWidth) - 1n };
};

export const fits = (value: bigint, bitWidth: number, signed: boolean): boolean => {
  const range = rangeOf(bitWidth, signed);
  if (!range) return true;
  return value >= range.low && value <= range.high;
};

/**
 * Reads one group of digits.
 *
 * A minus sign is accepted only where it could mean anything: in decimal, or
 * in a base with no width behind it. With a width, the sign *is* the top bit —
 * writing `-101010` in eight-bit two's complement is the mistake the question
 * is usually about, so it is refused rather than quietly understood.
 */
const readGroup = (
  group: string,
  representation: Exclude<Representation, "text">,
  options: ParseOptions,
): Reading => {
  let text = group.toLowerCase();
  const radix = RADIX[representation];
  const signAllowed =
    options.signed && (representation === "decimal" || options.bitWidth <= 0);

  let negative = false;
  if (text.startsWith("-")) {
    if (!signAllowed) return { ok: false, reason: "negative" };
    negative = true;
    text = text.slice(1);
  } else if (text.startsWith("+")) {
    text = text.slice(1);
  }

  for (const prefix of PREFIX[representation] ?? []) {
    if (!text.startsWith(prefix)) continue;
    if (!options.allowPrefix) return { ok: false, reason: "badDigit" };
    text = text.slice(prefix.length);
  }

  if (text === "") return { ok: false, reason: "empty" };

  const allowed = DIGITS.slice(0, radix);
  if ([...text].some((digit) => !allowed.includes(digit))) {
    return { ok: false, reason: "badDigit" };
  }

  const needed = digitsNeeded(options.bitWidth, representation);
  if (needed > 0) {
    if (text.length > needed) return { ok: false, reason: "tooWide" };
    if (options.requireFullWidth && text.length !== needed) {
      return { ok: false, reason: "notFullWidth" };
    }
  }

  let value = 0n;
  for (const digit of text) value = value * BigInt(radix) + BigInt(DIGITS.indexOf(digit));

  // In a base with a width, what was written is the bit pattern, so the top
  // half of it is negative. In decimal it is a number, and the sign said so.
  if (!negative && options.signed && options.bitWidth > 0 && representation !== "decimal") {
    if (value >= pow2(options.bitWidth - 1)) value -= pow2(options.bitWidth);
  }
  if (negative) value = -value;

  if (!fits(value, options.bitWidth, options.signed)) {
    return { ok: false, reason: "tooWide" };
  }

  return { ok: true, values: [value] };
};

/** Reads a written value: a piece of text, or one or more groups of digits. */
export const read = (
  written: string,
  representation: Representation,
  options: ParseOptions,
): Reading => {
  if (representation === "text") {
    // Text is not trimmed: a space is a character with a code of its own, and
    // "write a space in binary" is a question somebody asks.
    if (written === "") return { ok: false, reason: "empty" };
    const values = [...written].map((letter) =>
      BigInt(letter.codePointAt(0) as number),
    );
    return values.every((value) => fits(value, options.bitWidth, options.signed))
      ? { ok: true, values }
      : { ok: false, reason: "tooWide" };
  }

  const trimmed = written.trim();
  if (trimmed === "") return { ok: false, reason: "empty" };

  // A space separates one value from the next; an underscore only groups the
  // digits of one. Letting either do both would make `0100_1000` mean two
  // things at once, which is the ambiguity a separator must never have.
  const groups = options.allowSeparators
    ? trimmed
        .split(/\s+/)
        .map((group) => group.replace(/_/g, ""))
        .filter((group) => group !== "")
    : [trimmed];

  const values: bigint[] = [];
  for (const group of groups) {
    const reading = readGroup(group, representation, options);
    if (!reading.ok) return reading;
    values.push(...reading.values);
  }
  return { ok: true, values };
};

/** One value, written in a base. */
const writeGroup = (
  value: bigint,
  representation: Exclude<Representation, "text">,
  options: ParseOptions,
): string => {
  const radix = RADIX[representation];

  if (representation === "decimal") return value.toString(10);

  // Negatives are written as the pattern they are held as, which is the whole
  // point of a width: -42 in eight bits is 11010110, not -101010.
  const pattern =
    value < 0n && options.bitWidth > 0 ? value + pow2(options.bitWidth) : value;
  if (pattern < 0n) return `-${(-pattern).toString(radix)}`;

  const digits = pattern.toString(radix);
  const needed = digitsNeeded(options.bitWidth, representation);
  return needed > 0 ? digits.padStart(needed, "0") : digits;
};

/** How the values are written in a representation, in their canonical form. */
export const write = (
  values: bigint[],
  representation: Representation,
  options: ParseOptions,
): string => {
  if (representation === "text") {
    return values
      .map((value) =>
        value >= 0n && value <= 0x10ffffn ? String.fromCodePoint(Number(value)) : "?",
      )
      .join("");
  }
  return values
    .map((value) => writeGroup(value, representation, options))
    .join(" ");
};

/** Whether two readings are the same value, group for group. */
export const sameValue = (left: bigint[], right: bigint[]): boolean =>
  left.length === right.length && left.every((value, index) => value === right[index]);

/** The values as plain decimal, which is how a reading is shown back. */
export const asDecimal = (values: bigint[]): string =>
  values.map((value) => value.toString(10)).join(" ");
