export type CellValue = number | string;

class SheetError extends Error {}

export function indexToCol(index: number): string {
  let n = index;
  let out = "";
  do {
    out = String.fromCharCode(65 + (n % 26)) + out;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);
  return out;
}

export function colToIndex(col: string): number {
  let n = 0;
  for (const ch of col) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n - 1;
}

/** `"B3"` -> `{ row: 2, col: 1 }` (zero-based), or null when not a cell reference. */
export function parseRef(ref: string): { row: number; col: number } | null {
  const m = /^([A-Z]+)(\d+)$/.exec(ref);
  if (!m) return null;
  const row = Number(m[2]) - 1;
  return row < 0 ? null : { row, col: colToIndex(m[1]!) };
}

type Token =
  | { t: "num"; v: number }
  | { t: "ref"; v: string }
  | { t: "id"; v: string }
  | { t: "op"; v: string };

function tokenize(src: string): Token[] {
  const tokens: Token[] = [];
  const re = /\s*(?:(\d+\.?\d*|\.\d+)|([A-Za-z]+\d+)|([A-Za-z]+)|([-+*/(),:]))/y;
  let pos = 0;
  while (pos < src.length) {
    re.lastIndex = pos;
    const m = re.exec(src);
    if (!m) {
      if (src.slice(pos).trim() === "") break;
      throw new SheetError("#ERR!");
    }
    pos = re.lastIndex;
    if (m[1] !== undefined) tokens.push({ t: "num", v: Number(m[1]) });
    else if (m[2] !== undefined) tokens.push({ t: "ref", v: m[2].toUpperCase() });
    else if (m[3] !== undefined) tokens.push({ t: "id", v: m[3].toUpperCase() });
    else tokens.push({ t: "op", v: m[4]! });
  }
  return tokens;
}

type Reader = (row: number, col: number) => CellValue;

/** One argument value: a scalar or the flattened cells of a range. */
type Arg = number | string | CellValue[];

/** A formula function: receives every numeric argument (ranges flattened, text and blanks skipped). */
export type SheetFunction = (nums: number[]) => number;

const AGGREGATES: Record<string, SheetFunction> = {
  PRODUCT: (n) => n.reduce((a, b) => a * b, 1),
  MEDIAN: (n) => {
    if (n.length === 0) throw new SheetError("#NUM!");
    const s = [...n].sort((a, b) => a - b);
    const m = Math.floor(s.length / 2);
    return s.length % 2 ? s[m]! : (s[m - 1]! + s[m]!) / 2;
  },
  SUM: (n) => n.reduce((a, b) => a + b, 0),
  AVERAGE: (n) => {
    if (n.length === 0) throw new SheetError("#DIV/0!");
    return n.reduce((a, b) => a + b, 0) / n.length;
  },
  MIN: (n) => (n.length ? Math.min(...n) : 0),
  MAX: (n) => (n.length ? Math.max(...n) : 0),
  COUNT: (n) => n.length
};

function evaluateFormula(src: string, read: Reader, custom: Record<string, SheetFunction>): number {
  const tokens = tokenize(src);
  let i = 0;
  const peek = () => tokens[i];
  const isOp = (v: string) => {
    const tk = peek();
    return tk?.t === "op" && tk.v === v;
  };
  const expectOp = (v: string) => {
    if (!isOp(v)) throw new SheetError("#ERR!");
    i++;
  };

  const toNumber = (v: CellValue): number => {
    if (typeof v === "number") return v;
    if (v === "") return 0;
    if (v.startsWith("#")) throw new SheetError(v); // propagate upstream errors
    const n = Number(v);
    if (Number.isNaN(n)) throw new SheetError("#VALUE!");
    return n;
  };

  const rangeCells = (a: string, b: string): CellValue[] => {
    const p = parseRef(a);
    const q = parseRef(b);
    if (!p || !q) throw new SheetError("#REF!");
    const out: CellValue[] = [];
    for (let r = Math.min(p.row, q.row); r <= Math.max(p.row, q.row); r++) {
      for (let c = Math.min(p.col, q.col); c <= Math.max(p.col, q.col); c++) out.push(read(r, c));
    }
    return out;
  };

  const parseExpr = (): number => {
    let v = parseTerm();
    while (isOp("+") || isOp("-")) {
      const op = (tokens[i++] as { v: string }).v;
      const rhs = parseTerm();
      v = op === "+" ? v + rhs : v - rhs;
    }
    return v;
  };

  const parseTerm = (): number => {
    let v = parseFactor();
    while (isOp("*") || isOp("/")) {
      const op = (tokens[i++] as { v: string }).v;
      const rhs = parseFactor();
      if (op === "/" && rhs === 0) throw new SheetError("#DIV/0!");
      v = op === "*" ? v * rhs : v / rhs;
    }
    return v;
  };

  const parseFactor = (): number => {
    const tk = peek();
    if (!tk) throw new SheetError("#ERR!");
    if (tk.t === "op" && tk.v === "-") {
      i++;
      return -parseFactor();
    }
    if (tk.t === "op" && tk.v === "(") {
      i++;
      const v = parseExpr();
      expectOp(")");
      return v;
    }
    if (tk.t === "num") {
      i++;
      return tk.v;
    }
    if (tk.t === "ref") {
      i++;
      if (isOp(":")) throw new SheetError("#VALUE!"); // a bare range outside a function
      const p = parseRef(tk.v);
      if (!p) throw new SheetError("#REF!");
      return toNumber(read(p.row, p.col));
    }
    if (tk.t === "id") {
      i++;
      const fn = custom[tk.v] ?? AGGREGATES[tk.v];
      if (!fn) throw new SheetError("#NAME?");
      expectOp("(");
      const args: Arg[] = [];
      if (!isOp(")")) {
        do {
          if (isOp(",")) i++;
          args.push(parseArg());
        } while (isOp(","));
      }
      expectOp(")");
      const nums: number[] = [];
      for (const a of args) {
        if (Array.isArray(a)) {
          // Ranges skip text and blanks, as spreadsheets do; errors still propagate.
          for (const cell of a) {
            if (typeof cell === "number") nums.push(cell);
            else if (cell.startsWith("#")) throw new SheetError(cell);
            else if (cell !== "" && !Number.isNaN(Number(cell))) nums.push(Number(cell));
          }
        } else nums.push(toNumber(a));
      }
      return fn(nums);
    }
    throw new SheetError("#ERR!");
  };

  const parseArg = (): Arg => {
    const tk = peek();
    const next = tokens[i + 1];
    if (tk?.t === "ref" && next?.t === "op" && next.v === ":") {
      const end = tokens[i + 2];
      if (end?.t !== "ref") throw new SheetError("#ERR!");
      i += 3;
      return rangeCells(tk.v, end.v);
    }
    return parseExpr();
  };

  const result = parseExpr();
  if (i < tokens.length) throw new SheetError("#ERR!");
  return result;
}

/** Trims float noise (0.1 + 0.2) so results read as users expect. */
function cleanNumber(n: number): number {
  return Number.isFinite(n) ? Number(n.toPrecision(12)) : n;
}

/**
 * Evaluates every cell of a raw grid. Strings starting with `=` are formulas; everything else is
 * a literal (numeric strings become numbers). Errors surface as `#DIV/0!`, `#CYCLE!`, etc.
 */
export function evaluateGrid(raw: string[][], functions: Record<string, SheetFunction> = {}): CellValue[][] {
  // Function names are matched case-insensitively.
  const custom = Object.fromEntries(Object.entries(functions).map(([k, f]) => [k.toUpperCase(), f]));
  const cache = new Map<string, CellValue>();
  const visiting = new Set<string>();

  const read = (row: number, col: number): CellValue => {
    const key = `${row}:${col}`;
    const cached = cache.get(key);
    if (cached !== undefined) return cached;
    if (visiting.has(key)) throw new SheetError("#CYCLE!");
    const text = raw[row]?.[col] ?? "";
    let value: CellValue;
    if (text.startsWith("=")) {
      visiting.add(key);
      try {
        const n = evaluateFormula(text.slice(1), read, custom);
        value = Number.isNaN(n) ? "#ERR!" : cleanNumber(n);
      } catch (e) {
        value = e instanceof SheetError ? e.message : "#ERR!"; // a throwing custom function lands here too
      } finally {
        visiting.delete(key);
      }
    } else if (text.trim() !== "" && !Number.isNaN(Number(text))) {
      value = Number(text);
    } else {
      value = text;
    }
    cache.set(key, value);
    return value;
  };

  return raw.map((r, ri) => r.map((_, ci) => read(ri, ci)));
}
