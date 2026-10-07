/**
 * @module effects
 * Micro-interaction helpers: animated counting and ripple touch effects.
 * UI layer — DOM-dependent.
 */

/**
 * Animate a numeric value from `start` to `end` with easeOutCubic easing.
 * Adds a "number-bump" class at the end for the pop effect.
 * @param {HTMLElement} el – target element whose innerText will be updated
 * @param {number} start – starting number
 * @param {number} end – ending number
 * @param {number} [duration=380] – animation duration in ms
 * @param {function} [formatFn] – optional formatter (receives number, returns string)
 */
export function animateCount(el, start, end, duration = 380, formatFn = (n) => n) {
  if (!el) return;
  const s = Number(start) || 0;
  const e = Number(end) || 0;
  if (s === e) { el.innerText = formatFn(e); return; }
  const hasRAF = typeof requestAnimationFrame === 'function';
  const nowFn = (typeof performance !== 'undefined' && typeof performance.now === 'function')
    ? () => performance.now() : () => Date.now();
  if (!hasRAF) { el.innerText = formatFn(e); return; }
  const startTime = nowFn();
  function step(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const ease = 1 - Math.pow(1 - progress, 3); // easeOutCubic
    const current = Math.round(s + (e - s) * ease);
    el.innerText = formatFn(current);
    if (progress < 1) {
      requestAnimationFrame(step);
    } else {
      el.innerText = formatFn(e);
      el.classList.add('number-bump');
      setTimeout(() => el.classList.remove('number-bump'), 320);
    }
  }
  requestAnimationFrame(step);
}

/**
 * Initialise global ripple effect on all `.btn-ripple` elements.
 * Uses `pointerdown` for optimal touch latency on mobile.
 */
export function initRippleEffects() {
  if (typeof document === 'undefined' || !document.addEventListener) return;
  document.addEventListener('pointerdown', (e) => {
    const btn = e.target && e.target.closest ? e.target.closest('.btn-ripple') : null;
    if (!btn) return;
    const circle = document.createElement('span');
    const diameter = Math.max(btn.clientWidth || 40, btn.clientHeight || 40);
    const radius = diameter / 2;
    const rect = btn.getBoundingClientRect ? btn.getBoundingClientRect() : { left: 0, top: 0 };
    const x = (e.clientX ? e.clientX - rect.left : (btn.clientWidth || 40) / 2) - radius;
    const y = (e.clientY ? e.clientY - rect.top : (btn.clientHeight || 40) / 2) - radius;
    circle.style.width = circle.style.height = `${diameter}px`;
    circle.style.left = `${x}px`;
    circle.style.top = `${y}px`;
    circle.className = 'ripple-wave';
    const existing = btn.querySelector ? btn.querySelector('.ripple-wave') : null;
    if (existing) existing.remove();
    btn.appendChild(circle);
    setTimeout(() => circle.remove(), 550);
  });
}
