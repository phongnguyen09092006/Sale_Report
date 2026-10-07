/**
 * @module navigation
 * Tab navigation controller for the 3-tab bottom nav.
 * UI layer — DOM-dependent.
 */

/**
 * Switch the active view tab, update header title, and scroll to top.
 * @param {string} viewId – target section id (e.g. 'view-lap-bao-cao')
 * @param {string} title – header title text
 * @param {function} [onHistoryTab] – optional callback when history tab activates
 */
export function switchTab(viewId, title, onHistoryTab) {
  document.querySelectorAll('.view-section').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.classList.remove('tab-active');
    tab.classList.add('text-on-surface-variant');
    tab.classList.remove('text-primary');
  });

  const target = document.getElementById(viewId);
  if (target) {
    target.classList.add('active');
    if (typeof window !== 'undefined' && window.scrollTo) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  const activeNav = document.querySelector(`.nav-tab[data-view="${viewId}"]`);
  if (activeNav) {
    activeNav.classList.add('tab-active', 'text-primary');
    activeNav.classList.remove('text-on-surface-variant');
  }

  const headerTitle = document.getElementById('header-title');
  if (headerTitle) {
    headerTitle.innerText = title;
    headerTitle.classList.add('number-bump');
    setTimeout(() => headerTitle.classList.remove('number-bump'), 320);
  }

  if (viewId === 'view-lich-su' && typeof onHistoryTab === 'function') {
    try {
      onHistoryTab();
    } catch (err) {
      console.warn('History view update warning:', err);
    }
  }
}

/**
 * Initialise bottom nav tab click handlers.
 * @param {function} [onHistoryTab] – callback to refresh history view when its tab is selected
 */
export function initNavigation(onHistoryTab) {
  document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.addEventListener('click', (e) => {
      e.preventDefault();
      const viewId = tab.getAttribute('data-view') || tab.dataset.view;
      const title = tab.getAttribute('data-title') || tab.dataset.title || '';
      if (viewId) {
        switchTab(viewId, title, onHistoryTab);
      }
    });
  });
}
