/**
 * @module settings-view
 * KPI settings view — input bindings, auto-calculate DS ngày, save to localStorage.
 * UI layer — DOM-dependent.
 */

import { DEFAULT_KPI } from '../../core/constants.js';
import { loadKPI, saveKPI } from '../../services/storage.js';
import { showToast } from '../toast.js';

/**
 * Initialise the settings view: load KPI values, bind all event listeners.
 * @param {object} callbacks – { updateMonthlyWidgets }
 */
export function initSettingsView(callbacks) {
  // Load and display KPI values
  Object.keys(DEFAULT_KPI).forEach(key => {
    const val = loadKPI(key);
    const el = document.getElementById(key);
    if (el) {
      el.value = val;
      el.addEventListener('input', (e) => {
        saveKPI(key, e.target.value);
        if (key === 'employeeName') {
          const settingsDisplay = document.getElementById('settings-emp-display');
          if (settingsDisplay) settingsDisplay.innerText = e.target.value;
        }
      });
    }
  });

  // Employee name display
  const savedName = String(loadKPI('employeeName') || DEFAULT_KPI.employeeName);
  const settingsDisplay = document.getElementById('settings-emp-display');
  if (settingsDisplay) settingsDisplay.innerText = savedName;

  // Update auto-calc note on KPI inputs
  updateAutoNote();

  const elMonth = document.getElementById('kpiMonthRevenue');
  const elDays = document.getElementById('kpiStandardDays');
  if (elMonth) elMonth.addEventListener('input', updateAutoNote);
  if (elDays) elDays.addEventListener('input', updateAutoNote);

  // Auto-calc DS ngày button
  const btnAutoCalc = document.getElementById('btnAutoCalc');
  if (btnAutoCalc) {
    btnAutoCalc.addEventListener('click', () => {
      const m = parseFloat(document.getElementById('kpiMonthRevenue')?.value) || 0;
      const d = parseFloat(document.getElementById('kpiStandardDays')?.value) || 25;
      const pace = Math.round(m / (d || 1));
      const elDay = document.getElementById('kpiDayRevenue');
      if (elDay) elDay.value = pace;
      updateAutoNote();
      showToast(`DS ngày tự tính: ${pace.toLocaleString('vi-VN')}k`);
    });
  }

  // Save KPI button
  const btnSave = document.getElementById('btnSaveKPI');
  if (btnSave) {
    btnSave.addEventListener('click', () => {
      ['kpiMonthRevenue', 'kpiDayRevenue', 'kpiTotalOrders', 'kpiStandardDays'].forEach(key => {
        const el = document.getElementById(key);
        if (el) saveKPI(key, el.value);
      });

      const orig = btnSave.innerHTML;
      btnSave.innerHTML = '<span class="material-symbols-outlined text-[20px]">check</span><span>Đã Lưu!</span>';
      btnSave.disabled = true;
      setTimeout(() => { btnSave.innerHTML = orig; btnSave.disabled = false; }, 2000);
      showToast('Đã lưu cài đặt chỉ tiêu!');

      const today = new Date();
      if (callbacks?.updateMonthlyWidgets) {
        callbacks.updateMonthlyWidgets(today.getMonth() + 1, today.getFullYear());
      }
    });
  }
}

/**
 * Update the auto-calculated daily revenue note and đồng conversion note.
 */
function updateAutoNote() {
  const m = parseFloat(document.getElementById('kpiMonthRevenue')?.value) || 0;
  const d = parseFloat(document.getElementById('kpiStandardDays')?.value) || 25;
  const pace = Math.round(m / (d || 1));

  const note = document.getElementById('daily-auto-note');
  if (note) note.textContent = `≈ ${pace.toLocaleString('vi-VN')}k (tự tính)`;

  const dongNote = document.getElementById('kpi-month-dong-note');
  if (dongNote) {
    const dong = Math.round(m * 1000);
    const dongStr = dong.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    dongNote.textContent = `=${dongStr} đ`;
  }
}
