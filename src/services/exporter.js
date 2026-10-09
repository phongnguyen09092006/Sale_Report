/**
 * @module exporter
 * CSV export service with UTF-8 BOM for correct Vietnamese display in Excel.
 * Service layer — uses DOM only for download trigger.
 */

import { fmt } from '../core/constants.js';

/**
 * Export history data as a downloadable CSV file.
 * Prepends UTF-8 BOM (\uFEFF) so Microsoft Excel renders Vietnamese diacritics correctly.
 * @param {Array<object>} historyData – array of report records
 * @returns {boolean} true if export succeeded, false if no data
 */
export function exportCSV(historyData) {
  if (!historyData || historyData.length === 0) return false;

  const headers = [
    "Ngày", "Ngày công", "Đơn trong ngày", "Tổng đơn",
    "DS ngày (k)", "Rớt đơn (k)", "DS lũy kế (k)",
    "Trưng bày 3%", "Trưng bày 5%", "Nội dung gốc"
  ];

  let csv = "\uFEFF" + headers.join(",") + "\n";

  historyData.forEach(item => {
    const raw = item.rawText
      ? item.rawText.replace(/"/g, '""').replace(/\r?\n/g, ' ')
      : '';
    const row = [
      item.date,
      item.workDay,
      item.orders,
      item.cumulativeOrders,
      fmt(item.revenue),
      (item.droppedRevenue || 0) + (item.deduction || 0),
      fmt(item.cumulative),
      item.count3 || 0,
      item.count5 || 0,
      `"${raw}"`
    ];
    csv += row.join(",") + "\n";
  });

  try {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `BaoCaoBanHang_HungDung_${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return true;
  } catch {
    return false;
  }
}

