// Honest-data helpers
//
// AGENTS.md forbids showing made-up numbers as if they were measured. The
// pattern that kept breaking that rule was quiet substitution: a day the
// upstream had no value for became "22.0", a missing field kept its hardcoded
// default, `value || default` turned a real 0 into a guess. These helpers are
// the replacement: a missing value stays missing, and a series is cut at its
// first gap rather than padded.

/** The value rounded to `digits`, or null when upstream didn't provide a finite number. */
export function num(v: unknown, digits = 1): number | null {
  return typeof v === "number" && Number.isFinite(v) ? parseFloat(v.toFixed(digits)) : null;
}

/**
 * How many leading entries every series has a real value for. Days after the
 * first gap are unknown, so callers cut there instead of inventing them.
 */
export function leadingComplete(...series: (unknown[] | undefined | null)[]): number {
  if (series.some((s) => !Array.isArray(s))) return 0;
  const arrays = series as unknown[][];
  const max = Math.min(...arrays.map((a) => a.length));
  let n = 0;
  while (n < max && arrays.every((a) => typeof a[n] === "number" && Number.isFinite(a[n] as number))) n++;
  return n;
}

/** The first `n` entries, rounded. Only call after leadingComplete() said they're all real. */
export function realSeries(values: unknown[], n: number, digits = 1): number[] {
  return values.slice(0, n).map((v) => parseFloat((v as number).toFixed(digits)));
}
