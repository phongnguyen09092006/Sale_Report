/**
 * @module date-utils
 * Date calculation utilities — pure functions, zero DOM dependency.
 */

/**
 * Calculate the next calendar day from a given d/m/y.
 * Handles month-end rollovers and leap years correctly.
 * @param {number} d – day (1-31)
 * @param {number} m – month (1-12)
 * @param {number} y – full year (e.g. 2026)
 * @returns {{ d: number, m: number, y: number, isFirstOfMonth: boolean }}
 */
export function calculateNextDay(d, m, y) {
  const isLeap = (y % 400 === 0) || (y % 4 === 0 && y % 100 !== 0);
  const daysInMonth = [0, 31, isLeap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  let nextD = d + 1;
  let nextM = m;
  let nextY = y;
  if (nextD > daysInMonth[m]) {
    nextD = 1;
    nextM = m + 1;
    if (nextM > 12) { nextM = 1; nextY = y + 1; }
  }
  return { d: nextD, m: nextM, y: nextY, isFirstOfMonth: nextD === 1 };
}
