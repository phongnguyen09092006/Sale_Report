/**
 * @module modal
 * Detail modal (bottom sheet) controller for viewing history records.
 * UI layer — DOM-dependent.
 */

import { fmt } from '../core/constants.js';
import { copyToClipboard } from './toast.js';

/** Currently displayed modal item reference. */
let currentModalItem = null;

/**
 * Open the detail bottom-sheet modal with data from a history record.
 * @param {object} item – history record object
 */
export function openDetailModal(item) {
  currentModalItem = item;
  const setEl = (id, text) => {
    const el = document.getElementById(id);
    if (el) el.innerText = text;
  };
  setEl('modalDayTag', `Ngày công ${item.workDay}`);
  setEl('modalDate', `Báo cáo ngày ${item.date}`);
  setEl('modalRevenue', `${fmt(item.revenue)}k`);
  setEl('modalCumulative', `${fmt(item.cumulative)}k`);
  setEl('modalOrders', `${item.orders} đơn`);
  setEl('modalDroppedOrders', item.droppedRevenue > 0 ? `${item.droppedOrders || 0} đơn (-${fmt(item.droppedRevenue)}k)` : `${item.droppedOrders || 0} đơn`);
  setEl('modalDeduction', `${item.deduction || 0}k`);
  setEl('modalDisplay', `${item.count3 || 0} / ${item.count5 || 0}`);
  setEl('modalReportText', item.reportText || '(Không có văn bản)');
  setEl('modalRawText', item.rawText || '(Không có đơn gốc)');

  const droppedBox = document.getElementById('modalDroppedBox');
  const droppedRaw = document.getElementById('modalDroppedRawText');
  if (item.droppedText && item.droppedText.trim()) {
    if (droppedBox) droppedBox.classList.remove('hidden');
    if (droppedRaw) droppedRaw.innerText = item.droppedText;
  } else {
    if (droppedBox) droppedBox.classList.add('hidden');
    if (droppedRaw) droppedRaw.innerText = '';
  }

  const modal = document.getElementById('detailModal');
  const sheet = document.getElementById('detailModalSheet');
  if (modal) modal.classList.add('modal-bg-open');
  if (sheet) setTimeout(() => sheet.classList.add('sheet-open'), 10);
}

/**
 * Close the detail bottom-sheet modal with animation.
 */
export function closeDetailModal() {
  const modal = document.getElementById('detailModal');
  const sheet = document.getElementById('detailModalSheet');
  if (sheet) sheet.classList.remove('sheet-open');
  if (modal) setTimeout(() => modal.classList.remove('modal-bg-open'), 300);
}

/**
 * Initialise modal event listeners (close button, backdrop click, copy buttons).
 */
export function initModal() {
  const btnClose = document.getElementById('btnCloseModal');
  if (btnClose) btnClose.addEventListener('click', closeDetailModal);

  const modal = document.getElementById('detailModal');
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeDetailModal();
    });
  }

  const btnCopyReport = document.getElementById('btnModalCopyReport');
  if (btnCopyReport) {
    btnCopyReport.addEventListener('click', () => {
      if (currentModalItem?.reportText) copyToClipboard(currentModalItem.reportText);
    });
  }

  const btnCopyRaw = document.getElementById('btnModalCopyRaw');
  if (btnCopyRaw) {
    btnCopyRaw.addEventListener('click', () => {
      if (currentModalItem?.rawText) copyToClipboard(currentModalItem.rawText);
    });
  }
}
