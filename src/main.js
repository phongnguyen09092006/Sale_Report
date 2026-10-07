/**
 * @module main
 * Application entry point — bootstraps all views, registers Service Worker.
 */

import { STATE_KEYS } from './core/constants.js';
import { loadHistory, saveHistory, clearHistory } from './services/storage.js';
import { exportCSV } from './services/exporter.js';
import { initRippleEffects } from './ui/effects.js';
import { showToast } from './ui/toast.js';
import { initNavigation } from './ui/navigation.js';
import { initModal } from './ui/modal.js';
import {
  initReportView, setReportDate, getHistoryData, setHistoryData,
  updateMonthlyWidgets, updateHeaderMonthBadge
} from './ui/views/report-view.js';
import { updateHistoryUI, refreshHistoryView } from './ui/views/history-view.js';
import { initSettingsView } from './ui/views/settings-view.js';

/**
 * Main application init.
 */
function init() {
  const callbacks = {
    onCalculated: () => {
      updateHistoryUI(getHistoryData());
    },
    updateMonthlyWidgets,
    updateHeaderMonthBadge
  };

  // Init views
  initReportView(callbacks);
  initSettingsView({ updateMonthlyWidgets });

  // Init UI components
  initNavigation(() => refreshHistoryView(getHistoryData()));
  initModal();
  initRippleEffects();

  // Render initial history
  updateHistoryUI(getHistoryData());

  // Update monthly widgets for current month
  const today = new Date();
  updateMonthlyWidgets(today.getMonth() + 1, today.getFullYear());
  updateHeaderMonthBadge(today.getMonth() + 1, today.getFullYear());

  // Export CSV button
  const btnExport = document.getElementById('btnExportCSV');
  if (btnExport) {
    btnExport.addEventListener('click', () => {
      const data = getHistoryData();
      if (data.length === 0) {
        showToast('Chưa có lịch sử để xuất!', true);
        return;
      }
      const success = exportCSV(data);
      if (success) showToast('Đã tải file CSV!');
    });
  }

  // Clear history button
  const btnClear = document.getElementById('btnClearHistory');
  if (btnClear) {
    btnClear.addEventListener('click', () => {
      if (confirm('⚠️ Xóa toàn bộ lịch sử? Không thể hoàn tác.')) {
        setHistoryData([]);
        clearHistory();
        updateHistoryUI([]);
        refreshHistoryView([]);
        const dateParts = document.getElementById('reportDate')?.value?.split('-') || [];
        if (dateParts.length === 3) {
          updateMonthlyWidgets(parseInt(dateParts[1]), parseInt(dateParts[0]));
        }
        showToast('Đã xóa toàn bộ lịch sử!');
      }
    });
  }

  // Register Service Worker
  registerServiceWorker();
}

/**
 * Register the PWA Service Worker.
 */
function registerServiceWorker() {
  try {
    if (window.location.protocol !== 'file:' && 'serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').catch(() => {
          // SW registration failed — app still works without offline support
        });
      });
    }
  } catch {
    // Service Worker not supported — silently continue
  }
}

// Start the application
init();
