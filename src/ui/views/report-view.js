/**
 * @module report-view
 * Report creation view — form inputs, calculation, copy output.
 * UI layer — DOM-dependent.
 */

import { STATE_KEYS, DEFAULT_KPI, fmt, fmtK } from '../../core/constants.js';
import { splitOrders, parsePrice, detectDiscount, parseDateFromText, createItemRegex, parseOrdersSummary } from '../../core/parser.js';
import { calculateNextDay } from '../../core/date-utils.js';
import { generateReportText } from '../../core/reporter.js';
import { loadHistory, saveHistory } from '../../services/storage.js';
import { animateCount } from '../effects.js';
import { showToast, copyToClipboard } from '../toast.js';

/** Module-level history data reference. Synced with storage on calculate. */
let historyData = [];

/** Reference to the most recently calculated report record. */
let lastCalculatedRecord = null;

/**
 * Provide external access to the current history data array.
 * @returns {Array<object>}
 */
export function getHistoryData() {
  return historyData;
}

/**
 * Replace the module-level history data (e.g. after clearing).
 * @param {Array<object>} data
 */
export function setHistoryData(data) {
  historyData = data;
}

/**
 * Initialise the report view: bind event listeners, set default date, load data.
 * @param {object} callbacks – { onCalculated, updateMonthlyWidgets, updateHeaderMonthBadge }
 */
export function initReportView(callbacks) {
  historyData = loadHistory();

  const today = new Date();
  setReportDate(today, callbacks);

  // Date change
  const elDate = document.getElementById('reportDate');
  if (elDate) {
    elDate.addEventListener('change', (e) => {
      if (e.target.value) {
        const parts = e.target.value.split('-');
        handleDateChange(
          new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2])),
          callbacks
        );
      }
    });
  }

  // Next day button
  const btnNext = document.getElementById('btnNextDay');
  if (btnNext) {
    btnNext.addEventListener('click', () => {
      const val = document.getElementById('reportDate')?.value;
      if (!val) return;
      const parts = val.split('-');
      const next = calculateNextDay(parseInt(parts[2]), parseInt(parts[1]), parseInt(parts[0]));
      setReportDate(new Date(next.y, next.m - 1, next.d), callbacks);
    });
  }

  // Parse date from text button
  const btnParse = document.getElementById('btnParseDate');
  if (btnParse) {
    btnParse.addEventListener('click', () => {
      const text = document.getElementById('rawText')?.value || '';
      const res = parseDateFromText(text);
      if (res && res.d > 0 && res.d <= 31 && res.m > 0 && res.m <= 12) {
        setReportDate(new Date(res.y, res.m - 1, res.d), callbacks);
      } else {
        showToast('Không tìm thấy ngày hợp lệ!', true);
      }
    });
  }

  // Dropped orders input change
  const elDropped = document.getElementById('droppedOrdersText');
  if (elDropped) {
    elDropped.addEventListener('input', updateDroppedNotice);
  }

  // Calculate button
  const btnCalc = document.getElementById('btnCalculate');
  if (btnCalc) {
    btnCalc.addEventListener('click', () => {
      calculateReport(callbacks);
    });
  }

  // Quick action: Next day button on result card
  const btnContinue = document.getElementById('btnContinueNextDay');
  if (btnContinue) {
    btnContinue.addEventListener('click', () => {
      setupNextDayReport(callbacks);
    });
  }

  // Quick action: Reset form button on result card
  const btnReset = document.getElementById('btnResetForm');
  if (btnReset) {
    btnReset.addEventListener('click', resetReportForm);
  }

  // Copy report button
  const btnCopy = document.getElementById('btnCopy');
  if (btnCopy) {
    btnCopy.addEventListener('click', () => {
      const text = document.getElementById('reportOutput')?.innerText || '';
      copyToClipboard(text);
      const icon = document.getElementById('copy-icon');
      const label = document.getElementById('copy-text');
      if (icon && label) {
        icon.textContent = 'check';
        label.textContent = 'Đã chép!';
        setTimeout(() => { icon.textContent = 'content_copy'; label.textContent = 'Sao chép'; }, 2000);
      }
    });
  }
}

/**
 * Set the report date input and trigger data load.
 * @param {Date} dateObj
 * @param {object} callbacks
 */
export function setReportDate(dateObj, callbacks) {
  const offset = dateObj.getTimezoneOffset();
  const localDate = new Date(dateObj.getTime() - (offset * 60 * 1000));
  const elDate = document.getElementById('reportDate');
  if (elDate) elDate.value = localDate.toISOString().split('T')[0];
  handleDateChange(dateObj, callbacks);
}

/**
 * Handle date change — update notice, widgets, auto-fill previous data.
 * @param {Date} dateObj
 * @param {object} callbacks
 */
function handleDateChange(dateObj, callbacks) {
  const d = dateObj.getDate();
  const m = dateObj.getMonth() + 1;
  const y = dateObj.getFullYear();
  const notice = document.getElementById('dateNotice');
  if (notice) notice.innerText = `✅ Đã chọn: Ngày ${d} tháng ${m} năm ${y}`;
  if (callbacks?.updateMonthlyWidgets) callbacks.updateMonthlyWidgets(m, y);
  if (callbacks?.updateHeaderMonthBadge) callbacks.updateHeaderMonthBadge(m, y);
  autoFillNextDayData(dateObj);
}

/**
 * Auto-fill work day, cumulative revenue, and cumulative orders
 * based on the most recent previous report in the same month.
 * @param {Date} dateObj
 */
function autoFillNextDayData(dateObj) {
  const targetMonth = dateObj.getMonth() + 1;
  const targetYear = dateObj.getFullYear();

  if (dateObj.getDate() === 1) {
    setField('workDay', 1);
    setField('cumulative', 0);
    setField('cumulativeOrders', 0);
    return;
  }

  const reqTime = dateObj.getTime();
  let latestReport = null;
  let maxTime = 0;

  (historyData || []).forEach(item => {
    if (!item || !item.date || typeof item.date !== 'string') return;
    const parts = item.date.split('/');
    if (parts.length < 3) return;
    const [dd, mm, yy] = parts;
    if (parseInt(mm) === targetMonth && parseInt(yy) === targetYear) {
      const itemDate = new Date(parseInt(yy), parseInt(mm) - 1, parseInt(dd));
      if (itemDate.getTime() < reqTime && itemDate.getTime() > maxTime) {
        maxTime = itemDate.getTime();
        latestReport = item;
      }
    }
  });

  if (latestReport) {
    setField('workDay', parseInt(latestReport.workDay) + 1);
    setField('cumulative', Math.round(latestReport.cumulative));
    setField('cumulativeOrders', latestReport.cumulativeOrders);
  } else {
    setField('workDay', 1);
    setField('cumulative', 0);
    setField('cumulativeOrders', 0);
  }
}

/**
 * Main calculation pipeline — parses orders, applies discounts, generates report text.
 * Strictly uses the date chosen in #reportDate, never auto-parses date from text.
 * @param {object} callbacks
 */
function calculateReport(callbacks) {
  const text = document.getElementById('rawText')?.value || '';
  if (!text.trim()) { showToast('Vui lòng nhập nội dung đơn hàng!', true); return; }

  // 1. Xác định ngày báo cáo từ ô chọn ngày (#reportDate)
  const dateParts = document.getElementById('reportDate')?.value?.split('-') || [];
  if (dateParts.length < 3) {
    showToast('Ngày báo cáo không hợp lệ!', true);
    return;
  }
  const dateStr = `${parseInt(dateParts[2])}/${parseInt(dateParts[1])}/${parseInt(dateParts[0])}`;

  // 3. Cơ chế chống ghi đè nhầm: Nếu ngày này đã có trong Lịch Sử và text mới khác text cũ
  const existingRecord = (historyData || []).find(h => h.date === dateStr);
  if (existingRecord) {
    const isDifferentText = existingRecord.rawText && existingRecord.rawText.trim() !== text.trim();
    if (isDifferentText) {
      const nextDay = calculateNextDay(parseInt(dateParts[2]), parseInt(dateParts[1]), parseInt(dateParts[0]));
      const nextDayStr = `${nextDay.d}/${nextDay.m}/${nextDay.y}`;
      const userWantsUpdate = typeof window !== 'undefined' && typeof window.confirm === 'function'
        ? window.confirm(
            `⚠️ Báo cáo ngày ${dateStr} đã tồn tại trong Lịch Sử!\n\n` +
            `• Nhấn [OK] nếu bạn muốn CẬP NHẬT LẠI ngày ${dateStr}.\n` +
            `• Nhấn [Hủy / Cancel] để TỰ ĐỘNG LƯU SANG NGÀY TIẾP THEO (${nextDayStr}) và giữ nguyên cả 2 ngày trong Lịch Sử.`
          )
        : true;

      if (!userWantsUpdate) {
        // Tự động chuyển sang ngày tiếp theo, kế thừa lũy kế từ ngày trước
        const nextDateObj = new Date(nextDay.y, nextDay.m - 1, nextDay.d);
        setReportDate(nextDateObj, callbacks);
        setField('workDay', (parseInt(existingRecord.workDay) || 0) + 1);
        setField('cumulative', Math.round(existingRecord.cumulative || 0));
        setField('cumulativeOrders', existingRecord.cumulativeOrders || 0);
        calculateReport(callbacks);
        return;
      }
    }
  }

  const dayOrders = parseOrdersSummary(text);
  const totalRevenue = dayOrders.totalRevenue;
  const count3 = dayOrders.count3;
  const count5 = dayOrders.count5;
  const validOrderCount = dayOrders.validOrderCount;

  // Phân tích đơn rớt / huỷ
  const droppedText = document.getElementById('droppedOrdersText')?.value || '';
  const droppedOrders = parseOrdersSummary(droppedText);
  const droppedCount = droppedOrders.validOrderCount;
  const droppedRevenue = droppedOrders.totalRevenue;

  // 1. Số đơn ngày và Doanh số ngày: KHÔNG được phép trừ đơn rớt hay tiền thu hồi
  const dailyOrders = validOrderCount;
  const dailyRevenue = Math.round(totalRevenue);

  // 2. Đơn rớt chỉ được phép trừ vào số đơn cũ và doanh số luỹ kế
  const prevOrders = parseInt(document.getElementById('cumulativeOrders')?.value) || 0;
  const newOrders = Math.max(0, prevOrders - droppedCount + dailyOrders);

  // 3. Tiền bị thu hồi và tiền đơn rớt: CHỈ được phép trừ vào doanh số luỹ kế
  const manualDeduction = Math.round(parseFloat(document.getElementById('deduction')?.value) || 0);
  const prevCumulative = Math.round(parseFloat(document.getElementById('cumulative')?.value) || 0);
  const newCumulative = Math.max(0, Math.round(prevCumulative + dailyRevenue - droppedRevenue - manualDeduction));

  const workDay = parseInt(document.getElementById('workDay')?.value) || 1;

  const kpiStandardDays = parseInt(document.getElementById('kpiStandardDays')?.value) || DEFAULT_KPI.kpiStandardDays;
  const kpiMonthRevenue = Math.round(parseFloat(document.getElementById('kpiMonthRevenue')?.value) || DEFAULT_KPI.kpiMonthRevenue);
  const kpiDayRevenue = Math.round(parseFloat(document.getElementById('kpiDayRevenue')?.value) || DEFAULT_KPI.kpiDayRevenue);
  const kpiTotalOrders = parseInt(document.getElementById('kpiTotalOrders')?.value) || DEFAULT_KPI.kpiTotalOrders;

  const staffName = (document.getElementById('employeeName')?.value || '').trim() || DEFAULT_KPI.employeeName;

  const reportText = generateReportText({
    dateStr, workDay, kpiStandardDays,
    netRevenue: dailyRevenue,
    newCumulative,
    kpiMonthRevenue, kpiDayRevenue,
    validOrderCount: dailyOrders,
    newOrders,
    kpiTotalOrders,
    count3, count5, staffName
  });

  // Display result
  const elOutput = document.getElementById('reportOutput');
  if (elOutput) elOutput.innerText = reportText;

  const resultCard = document.getElementById('reportResultCard');
  if (resultCard) {
    resultCard.classList.remove('hidden');
    resultCard.classList.remove('result-reveal-pop');
    void resultCard.offsetWidth; // force reflow
    resultCard.classList.add('result-reveal-pop');
    resultCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  // Save record
  const record = {
    id: Date.now(),
    date: dateStr,
    employeeName: staffName,
    workDay,
    orders: dailyOrders,
    rawOrderCount: dailyOrders,
    droppedOrders: droppedCount,
    revenue: Math.round(dailyRevenue),
    deduction: manualDeduction,
    droppedRevenue: Math.round(droppedRevenue),
    cumulative: Math.round(newCumulative),
    cumulativeOrders: newOrders,
    count3,
    count5,
    rawText: text,
    droppedText,
    reportText
  };

  lastCalculatedRecord = record;

  historyData = historyData.filter(h => h.date !== dateStr);
  historyData.push(record);
  historyData.sort((a, b) => {
    const da = a.date.split('/');
    const db = b.date.split('/');
    const dA = new Date(parseInt(da[2]), parseInt(da[1]) - 1, parseInt(da[0])).getTime();
    const dB = new Date(parseInt(db[2]), parseInt(db[1]) - 1, parseInt(db[0])).getTime();
    return dB === dA ? b.id - a.id : dB - dA;
  });

  saveHistory(historyData);
  if (callbacks?.onCalculated) callbacks.onCalculated();
  if (callbacks?.updateMonthlyWidgets) {
    callbacks.updateMonthlyWidgets(parseInt(dateParts[1]), parseInt(dateParts[0]));
  }

  // Auto copy
  copyToClipboard(reportText, false);
}

/**
 * Setup form for the next consecutive day:
 * Advances date, increments work day, transfers cumulative totals, clears raw text.
 * @param {object} callbacks
 */
export function setupNextDayReport(callbacks) {
  const val = document.getElementById('reportDate')?.value;
  if (!val) return;
  const parts = val.split('-');
  const next = calculateNextDay(parseInt(parts[2]), parseInt(parts[1]), parseInt(parts[0]));
  const nextDateObj = new Date(next.y, next.m - 1, next.d);

  setReportDate(nextDateObj, callbacks);

  if (lastCalculatedRecord) {
    setField('workDay', (parseInt(lastCalculatedRecord.workDay) || 0) + 1);
    setField('cumulative', Math.round(lastCalculatedRecord.cumulative || 0));
    setField('cumulativeOrders', lastCalculatedRecord.cumulativeOrders || 0);
  }
  setField('deduction', 0);

  const rawEl = document.getElementById('rawText');
  if (rawEl) {
    rawEl.value = '';
    rawEl.focus();
  }

  const droppedEl = document.getElementById('droppedOrdersText');
  if (droppedEl) droppedEl.value = '';
  const droppedNotice = document.getElementById('droppedNotice');
  if (droppedNotice) droppedNotice.innerText = '';

  const resultCard = document.getElementById('reportResultCard');
  if (resultCard) {
    resultCard.classList.add('hidden');
  }

  const anchor = document.getElementById('rawText');
  if (anchor) {
    anchor.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  showToast(`Đã chuyển sang ngày ${next.d}/${next.m}/${next.y}! Hãy dán đơn hàng mới.`);
}

/**
 * Reset raw input and result card for a fresh calculation.
 */
export function resetReportForm() {
  const rawEl = document.getElementById('rawText');
  if (rawEl) {
    rawEl.value = '';
    rawEl.focus();
  }
  setField('deduction', 0);

  const droppedEl = document.getElementById('droppedOrdersText');
  if (droppedEl) droppedEl.value = '';
  const droppedNotice = document.getElementById('droppedNotice');
  if (droppedNotice) droppedNotice.innerText = '';

  const resultCard = document.getElementById('reportResultCard');
  if (resultCard) {
    resultCard.classList.add('hidden');
  }
  showToast('Đã làm mới khung nhập đơn!');
}

/**
 * Update real-time feedback notice for dropped orders textarea.
 */
export function updateDroppedNotice() {
  const droppedText = document.getElementById('droppedOrdersText')?.value || '';
  const notice = document.getElementById('droppedNotice');
  if (!notice) return;
  if (!droppedText.trim()) {
    notice.innerText = '';
    return;
  }
  const summary = parseOrdersSummary(droppedText);
  if (summary.validOrderCount > 0) {
    notice.innerText = `⚠️ Nhận diện: ${summary.validOrderCount} đơn rớt (-${fmt(summary.totalRevenue)}k)`;
  } else {
    notice.innerText = '';
  }
}

/**
 * Update monthly display widgets (trưng bày counts + progress bar).
 * @param {number} month
 * @param {number} year
 */
export function updateMonthlyWidgets(month, year) {
  let count3 = 0;
  let count5 = 0;
  (historyData || []).forEach(item => {
    if (!item || !item.date || typeof item.date !== 'string') return;
    const parts = item.date.split('/');
    if (parts.length < 3) return;
    const [, m, y] = parts;
    if (parseInt(m) === month && parseInt(y) === year) {
      count3 += item.count3 || 0;
      count5 += item.count5 || 0;
    }
  });

  const el3 = document.getElementById('display3Count');
  const el5 = document.getElementById('display5Count');
  if (el3) { const prev3 = parseInt(el3.innerText) || 0; animateCount(el3, prev3, count3); }
  if (el5) { const prev5 = parseInt(el5.innerText) || 0; animateCount(el5, prev5, count5); }

  // Mini progress bar
  const kpiMonthRevenue = parseInt(localStorage.getItem('kpiMonthRevenue')) || DEFAULT_KPI.kpiMonthRevenue;
  let totalCum = 0;
  (historyData || []).forEach(item => {
    if (!item || !item.date || typeof item.date !== 'string') return;
    const parts = item.date.split('/');
    if (parts.length < 3) return;
    const [, m, y] = parts;
    if (parseInt(m) === month && parseInt(y) === year) {
      totalCum = Math.max(totalCum, item.cumulative || 0);
    }
  });

  const pct = Math.min(100, Math.round((totalCum / kpiMonthRevenue) * 100));
  const progressBar = document.getElementById('mini-progress-bar');
  const progressLabel = document.getElementById('mini-month-progress');
  const cumulativeLabel = document.getElementById('mini-cumulative-label');
  const kpiLabel = document.getElementById('mini-kpi-label');

  if (progressBar) progressBar.style.width = pct + '%';
  if (progressLabel) {
    const prevPct = parseInt(progressLabel.innerText) || 0;
    animateCount(progressLabel, prevPct, pct, 380, (n) => `${n}%`);
  }
  if (cumulativeLabel) cumulativeLabel.innerText = `Lũy kế: ${fmtK(totalCum)}`;
  if (kpiLabel) kpiLabel.innerText = `Mục tiêu: ${fmtK(kpiMonthRevenue)}`;
}

/**
 * Update header month badge display.
 * @param {number} m – month (1-12)
 * @param {number} y – full year
 */
export function updateHeaderMonthBadge(m, y) {
  const badge = document.getElementById('header-month-badge');
  if (badge) badge.innerText = `T${m}/${y}`;
  const displayBadge = document.getElementById('display-month-badge');
  if (displayBadge) displayBadge.innerText = `Tháng ${m}/${y}`;
}

/**
 * Helper to set an input field value.
 * @param {string} id
 * @param {*} val
 */
function setField(id, val) {
  const el = document.getElementById(id);
  if (el) el.value = val;
}

