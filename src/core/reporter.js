/**
 * @module reporter
 * Generates the final report text for Zalo/Telegram sharing.
 * Format contract is a BUSINESS INVARIANT — every newline matters.
 * Pure function — zero DOM dependency.
 */

import { fmt, fmtMonthKPI } from './constants.js';

/**
 * Generate the full report text matching the exact Zalo/Telegram format.
 * @param {object} params
 * @param {string} params.dateStr – e.g. "28/9/2026"
 * @param {number} params.workDay
 * @param {number} params.kpiStandardDays
 * @param {number} params.netRevenue – daily net revenue (k)
 * @param {number} params.newCumulative – month-to-date cumulative (k)
 * @param {number} params.kpiMonthRevenue – monthly KPI target (k)
 * @param {number} params.kpiDayRevenue – daily KPI target (k)
 * @param {number} params.validOrderCount – orders today
 * @param {number} params.newOrders – cumulative orders this month
 * @param {number} params.kpiTotalOrders – monthly order target
 * @param {number} params.count3 – display discount 3% count
 * @param {number} params.count5 – display discount 5% count
 * @param {string} params.staffName – employee name
 * @returns {string} formatted report text
 */
export function generateReportText({
  dateStr, workDay, kpiStandardDays, netRevenue, newCumulative,
  kpiMonthRevenue, kpiDayRevenue, validOrderCount, newOrders, kpiTotalOrders,
  count3, count5, staffName
}) {
  const timeProgress = Math.round((workDay / kpiStandardDays) * 100);
  const monthProgress = Math.round((newCumulative / kpiMonthRevenue) * 100);
  const dayProgress = Math.round((netRevenue / kpiDayRevenue) * 100);
  const orderProgress = Math.round((newOrders / kpiTotalOrders) * 100);

  let reportText = `Báo cáo bán hàng ngày:      ${dateStr}\n`;
  reportText += `- NV: ${staffName}\n`;
  reportText += `- Tiến độ thời gian : ${workDay}/${kpiStandardDays}/${timeProgress}%\n`;
  reportText += `- DS  bán giấy : ${fmt(netRevenue)}/${fmt(newCumulative)}/${fmtMonthKPI(kpiMonthRevenue)}\n`;
  reportText += `- DS ngày : ${fmt(netRevenue)}/${kpiDayRevenue}/${dayProgress}%\n`;
  reportText += `- Tiến độ % đạt: ${monthProgress}%\n`;
  reportText += `- Đơn hàng: ${validOrderCount}/${newOrders}/${kpiTotalOrders}/${orderProgress}%\n`;
  reportText += `- Trưng bày 3%: ${count3 > 0 ? count3 : 'o'}`;
  if (count5 > 0) reportText += `\n- Trưng bày 5%: ${count5}`;
  return reportText;
}
