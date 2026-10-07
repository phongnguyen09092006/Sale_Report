/**
 * @module toast
 * Toast notification UI component.
 * UI layer — DOM-dependent.
 */

/**
 * Show a toast notification at the top of the screen.
 * Automatically hides after 2.5 seconds.
 * @param {string} message – notification text
 * @param {boolean} [isError=false] – reserved for future styling
 */
export function showToast(message, isError = false) {
  const toast = document.getElementById('toast');
  const text = document.getElementById('toast-text');
  if (!toast || !text) return;
  text.textContent = message;
  toast.classList.remove('opacity-0', 'scale-90');
  toast.classList.add('opacity-100', 'scale-100');
  setTimeout(() => {
    toast.classList.remove('opacity-100', 'scale-100');
    toast.classList.add('opacity-0', 'scale-90');
  }, 2500);
}

/**
 * Copy text to clipboard with automatic fallback for older browsers.
 * Shows a toast notification on success (when `notify` is true).
 * @param {string} text – text to copy
 * @param {boolean} [notify=true] – whether to show toast on success
 */
export function copyToClipboard(text, notify = true) {
  const doNotify = () => { if (notify) showToast('Đã sao chép báo cáo!'); };
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(doNotify).catch(() => fallbackCopy(text, notify));
    } else {
      fallbackCopy(text, notify);
    }
  } catch {
    fallbackCopy(text, notify);
  }
}

/**
 * Fallback copy using a temporary textarea + execCommand.
 * @param {string} text
 * @param {boolean} [notify=true]
 */
function fallbackCopy(text, notify = true) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.left = '0';
  ta.style.top = '0';
  document.body.appendChild(ta);
  ta.focus();
  ta.select();
  try {
    document.execCommand('copy');
    if (notify) showToast('Đã sao chép!');
  } catch {
    // Copy failed silently
  }
  document.body.removeChild(ta);
}
