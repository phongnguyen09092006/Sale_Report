/**
 * @module history-view
 * History list view — renders report cards, manages the history summary panel.
 * UI layer — DOM-dependent.
 */

import { DEFAULT_KPI, fmt, fmtK } from '../../core/constants.js';
import { openDetailModal } from '../modal.js';

/**
 * Render the history card list from historyData.
 * @param {Array<object>} historyData
 */
export function updateHistoryUI(historyData) {
  const list = document.getElementById('historyList');
  if (!list) return;
  list.innerHTML = '';

  const data = Array.isArray(historyData) ? historyData : [];
  if (data.length === 0) {
    list.innerHTML = '<div class="text-center text-on-surface-variant font-body-md py-8">Chưa có báo cáo nào.</div>';
    return;
  }

  data.forEach((item, index) => {
    if (!item || !item.date) return;
    const div = document.createElement('div');
    div.className = 'history-card-in bg-surface-container-lowest rounded-xl p-space-md shadow-sm border border-outline-variant/20 flex flex-col gap-space-sm active:bg-surface-container-low transition-colors cursor-pointer relative overflow-hidden';
    if (div.style) div.style.animationDelay = `${Math.min(index * 45, 300)}ms`;

    const today = new Date();
    const todayStr = `${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`;
    const isToday = item.date === todayStr;

    div.innerHTML = `
      ${isToday ? '<div class="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-l-xl"></div>' : ''}
      <div class="flex items-center justify-between ${isToday ? 'pl-2' : ''}">
        <div class="flex items-center gap-space-xs">
          <span class="font-headline-sm text-headline-sm text-on-surface font-bold">${item.date}</span>
          ${isToday ? '<span class="px-2 py-0.5 rounded-full bg-primary/10 text-primary font-label-sm text-label-sm font-bold shadow-sm">Hôm nay</span>' : ''}
          <span class="font-label-sm text-label-sm text-on-surface-variant">• Ngày công ${item.workDay}</span>
        </div>
        <div class="flex items-center gap-1 text-secondary font-label-sm text-label-sm font-semibold">
          <span class="material-symbols-outlined text-[16px]">check_circle</span>
          Đã lưu
        </div>
      </div>
      <div class="grid grid-cols-2 gap-space-sm bg-surface-container-low rounded-lg px-space-sm py-space-xs">
        <div>
          <span class="font-label-sm text-label-sm text-on-surface-variant block">Doanh số ngày</span>
          <span class="font-headline-sm text-headline-sm text-primary font-bold font-mono">${fmt(item.revenue)}k</span>
        </div>
        <div>
          <span class="font-label-sm text-label-sm text-on-surface-variant block">Lũy tiến tháng</span>
          <span class="font-label-lg text-label-lg text-on-surface font-semibold font-mono">${fmt(item.cumulative)}k</span>
        </div>
      </div>
      <div class="flex items-center justify-between">
        <span class="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-1">
          <span class="material-symbols-outlined text-[16px] text-outline">shopping_bag</span>
          ${item.orders} đơn ${item.droppedOrders > 0 ? `<span class="text-error font-medium">(-${item.droppedOrders} rớt)</span>` : ''}| TB: ${item.count3 || 0}(3%) ${item.count5 || 0}(5%)
        </span>
        <span class="material-symbols-outlined text-on-surface-variant text-[18px] group-hover:translate-x-1 transition-transform">chevron_right</span>
      </div>
    `;
    div.addEventListener('click', () => openDetailModal(item));
    list.appendChild(div);
  });
}

/**
 * Refresh the history overview panel (month summary, progress bar, record count).
 * @param {Array<object>} historyData
 */
export function refreshHistoryView(historyData) {
  const data = Array.isArray(historyData) ? historyData : [];
  updateHistoryUI(data);

  let m, y;
  if (data.length > 0 && data[0]?.date) {
    const pts = data[0].date.split('/');
    if (pts.length >= 3) {
      m = parseInt(pts[1]);
      y = parseInt(pts[2]);
    }
  }
  if (!m || !y) {
    const today = new Date();
    m = today.getMonth() + 1;
    y = today.getFullYear();
  }
  const kpiMonthRevenue = parseInt(localStorage.getItem('kpiMonthRevenue')) || DEFAULT_KPI.kpiMonthRevenue;

  const monthItems = data.filter(h => {
    if (!h || !h.date || typeof h.date !== 'string') return false;
    const pts = h.date.split('/');
    return pts.length >= 2 && parseInt(pts[1]) === m && parseInt(pts[2]) === y;
  });
  const totalCum = monthItems.reduce((s, h) => Math.max(s, h.cumulative || 0), 0);
  const pct = Math.min(100, Math.round((totalCum / kpiMonthRevenue) * 100));

  const setEl = (id, text) => {
    const el = document.getElementById(id);
    if (el) el.innerText = text;
  };

  setEl('history-month-title', `Tháng ${m}/${y}`);
  setEl('history-record-count', `${monthItems.length} Báo Cáo`);
  setEl('history-total-rev', fmtK(totalCum));
  setEl('history-days-worked', `${monthItems.length} ngày báo cáo`);
  setEl('history-progress-pct', `Tiến độ: ${pct}%`);

  const bar = document.getElementById('history-progress-bar');
  if (bar) bar.style.width = pct + '%';
}
