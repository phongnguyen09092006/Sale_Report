/**
 * @module constants
 * State keys for persistence and default KPI configuration.
 * Pure formatting helpers — zero DOM dependency.
 */

export const STATE_KEYS = {
  employeeName: 'employeeName',
  kpiMonthRevenue: 'kpiMonthRevenue',
  kpiDayRevenue: 'kpiDayRevenue',
  kpiTotalOrders: 'kpiTotalOrders',
  kpiStandardDays: 'kpiStandardDays',
  history: 'reportHistory'
};

export const DEFAULT_KPI = {
  employeeName: 'HÙNG DŨNG',
  kpiMonthRevenue: 120000,
  kpiDayRevenue: 4600,
  kpiTotalOrders: 175,
  kpiStandardDays: 25
};

/**
 * Round a numeric value to the nearest integer.
 * Returns 0 for NaN / undefined / null.
 * @param {number|string} num
 * @returns {number}
 */
export const fmt = (num) => Math.round(Number(num) || 0);

/**
 * Format a KPI month revenue value.
 * Values >= 1000 are shown as "Xtr" (triệu), otherwise "Xk" (ngàn).
 * @param {number|string} num – value in ngàn đồng (k)
 * @returns {string}
 */
export const fmtMonthKPI = (num) => {
  const n = Math.round(Number(num) || 0);
  return (n >= 1000) ? Math.round(n / 1000) + 'tr' : n + 'k';
};

/**
 * Format a number as Vietnamese locale string suffixed with "k".
 * @param {number} num – value in ngàn đồng
 * @returns {string}
 */
export const fmtK = (num) =>
  new Intl.NumberFormat('vi-VN').format(Math.round(num)) + 'k';
