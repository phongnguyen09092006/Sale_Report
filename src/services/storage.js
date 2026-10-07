/**
 * @module storage
 * Safe CRUD wrapper for localStorage.
 * Preserves the original schema keys exactly (BUSINESS INVARIANT).
 * Service layer — DOM-independent but uses window.localStorage.
 */

import { STATE_KEYS, DEFAULT_KPI } from '../core/constants.js';

/**
 * Load all history records from localStorage.
 * @returns {Array<object>}
 */
export function loadHistory() {
  try {
    return JSON.parse(localStorage.getItem(STATE_KEYS.history)) || [];
  } catch {
    return [];
  }
}

/**
 * Persist the full history array to localStorage.
 * @param {Array<object>} data
 */
export function saveHistory(data) {
  try {
    localStorage.setItem(STATE_KEYS.history, JSON.stringify(data));
  } catch {
    // localStorage quota exceeded — silently fail, data stays in memory
  }
}

/**
 * Remove all history from localStorage.
 */
export function clearHistory() {
  try {
    localStorage.removeItem(STATE_KEYS.history);
  } catch {
    // noop
  }
}

/**
 * Load a single KPI setting from localStorage with a DEFAULT_KPI fallback.
 * @param {string} key – one of the STATE_KEYS (e.g. 'kpiMonthRevenue')
 * @returns {string|number}
 */
export function loadKPI(key) {
  try {
    const val = localStorage.getItem(key);
    return val !== null ? val : DEFAULT_KPI[key];
  } catch {
    return DEFAULT_KPI[key];
  }
}

/**
 * Save a single KPI setting to localStorage.
 * @param {string} key
 * @param {string|number} value
 */
export function saveKPI(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // noop
  }
}

/**
 * Load all KPI values as an object.
 * @returns {{ employeeName: string, kpiMonthRevenue: number, kpiDayRevenue: number, kpiTotalOrders: number, kpiStandardDays: number }}
 */
export function loadAllKPI() {
  return {
    employeeName: String(loadKPI('employeeName') || DEFAULT_KPI.employeeName),
    kpiMonthRevenue: parseInt(loadKPI('kpiMonthRevenue')) || DEFAULT_KPI.kpiMonthRevenue,
    kpiDayRevenue: parseInt(loadKPI('kpiDayRevenue')) || DEFAULT_KPI.kpiDayRevenue,
    kpiTotalOrders: parseInt(loadKPI('kpiTotalOrders')) || DEFAULT_KPI.kpiTotalOrders,
    kpiStandardDays: parseInt(loadKPI('kpiStandardDays')) || DEFAULT_KPI.kpiStandardDays
  };
}
