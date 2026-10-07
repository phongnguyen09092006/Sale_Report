(() => {
  // src/core/constants.js
  var STATE_KEYS = {
    employeeName: "employeeName",
    kpiMonthRevenue: "kpiMonthRevenue",
    kpiDayRevenue: "kpiDayRevenue",
    kpiTotalOrders: "kpiTotalOrders",
    kpiStandardDays: "kpiStandardDays",
    history: "reportHistory"
  };
  var DEFAULT_KPI = {
    employeeName: "H\xD9NG D\u0168NG",
    kpiMonthRevenue: 12e4,
    kpiDayRevenue: 4600,
    kpiTotalOrders: 175,
    kpiStandardDays: 25
  };
  var fmt = (num) => Math.round(Number(num) || 0);
  var fmtMonthKPI = (num) => {
    const n = Math.round(Number(num) || 0);
    return n >= 1e3 ? Math.round(n / 1e3) + "tr" : n + "k";
  };
  var fmtK = (num) => new Intl.NumberFormat("vi-VN").format(Math.round(num)) + "k";

  // src/services/storage.js
  function loadHistory() {
    try {
      return JSON.parse(localStorage.getItem(STATE_KEYS.history)) || [];
    } catch {
      return [];
    }
  }
  function saveHistory(data) {
    try {
      localStorage.setItem(STATE_KEYS.history, JSON.stringify(data));
    } catch {
    }
  }
  function clearHistory() {
    try {
      localStorage.removeItem(STATE_KEYS.history);
    } catch {
    }
  }
  function loadKPI(key) {
    try {
      const val = localStorage.getItem(key);
      return val !== null ? val : DEFAULT_KPI[key];
    } catch {
      return DEFAULT_KPI[key];
    }
  }
  function saveKPI(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch {
    }
  }

  // src/services/exporter.js
  function exportCSV(historyData2) {
    if (!historyData2 || historyData2.length === 0) return false;
    const headers = [
      "Ng\xE0y",
      "Ng\xE0y c\xF4ng",
      "\u0110\u01A1n trong ng\xE0y",
      "T\u1ED5ng \u0111\u01A1n",
      "DS ng\xE0y (k)",
      "R\u1EDBt \u0111\u01A1n (k)",
      "DS l\u0169y k\u1EBF (k)",
      "Tr\u01B0ng b\xE0y 3%",
      "Tr\u01B0ng b\xE0y 5%",
      "N\u1ED9i dung g\u1ED1c"
    ];
    let csv = "\uFEFF" + headers.join(",") + "\n";
    historyData2.forEach((item) => {
      const raw = item.rawText ? item.rawText.replace(/"/g, '""').replace(/\r?\n/g, " ") : "";
      const row = [
        item.date,
        item.workDay,
        item.orders,
        item.cumulativeOrders,
        fmt(item.revenue),
        item.deduction || 0,
        fmt(item.cumulative),
        item.count3 || 0,
        item.count5 || 0,
        `"${raw}"`
      ];
      csv += row.join(",") + "\n";
    });
    try {
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
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

  // src/ui/effects.js
  function animateCount(el, start, end, duration = 380, formatFn = (n) => n) {
    if (!el) return;
    const s = Number(start) || 0;
    const e = Number(end) || 0;
    if (s === e) {
      el.innerText = formatFn(e);
      return;
    }
    const hasRAF = typeof requestAnimationFrame === "function";
    const nowFn = typeof performance !== "undefined" && typeof performance.now === "function" ? () => performance.now() : () => Date.now();
    if (!hasRAF) {
      el.innerText = formatFn(e);
      return;
    }
    const startTime = nowFn();
    function step(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(s + (e - s) * ease);
      el.innerText = formatFn(current);
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        el.innerText = formatFn(e);
        el.classList.add("number-bump");
        setTimeout(() => el.classList.remove("number-bump"), 320);
      }
    }
    requestAnimationFrame(step);
  }
  function initRippleEffects() {
    if (typeof document === "undefined" || !document.addEventListener) return;
    document.addEventListener("pointerdown", (e) => {
      const btn = e.target && e.target.closest ? e.target.closest(".btn-ripple") : null;
      if (!btn) return;
      const circle = document.createElement("span");
      const diameter = Math.max(btn.clientWidth || 40, btn.clientHeight || 40);
      const radius = diameter / 2;
      const rect = btn.getBoundingClientRect ? btn.getBoundingClientRect() : { left: 0, top: 0 };
      const x = (e.clientX ? e.clientX - rect.left : (btn.clientWidth || 40) / 2) - radius;
      const y = (e.clientY ? e.clientY - rect.top : (btn.clientHeight || 40) / 2) - radius;
      circle.style.width = circle.style.height = `${diameter}px`;
      circle.style.left = `${x}px`;
      circle.style.top = `${y}px`;
      circle.className = "ripple-wave";
      const existing = btn.querySelector ? btn.querySelector(".ripple-wave") : null;
      if (existing) existing.remove();
      btn.appendChild(circle);
      setTimeout(() => circle.remove(), 550);
    });
  }

  // src/ui/toast.js
  function showToast(message, isError = false) {
    const toast = document.getElementById("toast");
    const text = document.getElementById("toast-text");
    if (!toast || !text) return;
    text.textContent = message;
    toast.classList.remove("opacity-0", "scale-90");
    toast.classList.add("opacity-100", "scale-100");
    setTimeout(() => {
      toast.classList.remove("opacity-100", "scale-100");
      toast.classList.add("opacity-0", "scale-90");
    }, 2500);
  }
  function copyToClipboard(text, notify = true) {
    const doNotify = () => {
      if (notify) showToast("\u0110\xE3 sao ch\xE9p b\xE1o c\xE1o!");
    };
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
  function fallbackCopy(text, notify = true) {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.left = "0";
    ta.style.top = "0";
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    try {
      document.execCommand("copy");
      if (notify) showToast("\u0110\xE3 sao ch\xE9p!");
    } catch {
    }
    document.body.removeChild(ta);
  }

  // src/ui/navigation.js
  function switchTab(viewId, title, onHistoryTab) {
    document.querySelectorAll(".view-section").forEach((el) => el.classList.remove("active"));
    document.querySelectorAll(".nav-tab").forEach((tab) => {
      tab.classList.remove("tab-active");
      tab.classList.add("text-on-surface-variant");
      tab.classList.remove("text-primary");
    });
    const target = document.getElementById(viewId);
    if (target) {
      target.classList.add("active");
      if (typeof window !== "undefined" && window.scrollTo) {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }
    const activeNav = document.querySelector(`.nav-tab[data-view="${viewId}"]`);
    if (activeNav) {
      activeNav.classList.add("tab-active", "text-primary");
      activeNav.classList.remove("text-on-surface-variant");
    }
    const headerTitle = document.getElementById("header-title");
    if (headerTitle) {
      headerTitle.innerText = title;
      headerTitle.classList.add("number-bump");
      setTimeout(() => headerTitle.classList.remove("number-bump"), 320);
    }
    if (viewId === "view-lich-su" && typeof onHistoryTab === "function") {
      try {
        onHistoryTab();
      } catch (err) {
        console.warn("History view update warning:", err);
      }
    }
  }
  function initNavigation(onHistoryTab) {
    document.querySelectorAll(".nav-tab").forEach((tab) => {
      tab.addEventListener("click", (e) => {
        e.preventDefault();
        const viewId = tab.getAttribute("data-view") || tab.dataset.view;
        const title = tab.getAttribute("data-title") || tab.dataset.title || "";
        if (viewId) {
          switchTab(viewId, title, onHistoryTab);
        }
      });
    });
  }

  // src/ui/modal.js
  var currentModalItem = null;
  function openDetailModal(item) {
    currentModalItem = item;
    const setEl = (id, text) => {
      const el = document.getElementById(id);
      if (el) el.innerText = text;
    };
    setEl("modalDayTag", `Ng\xE0y c\xF4ng ${item.workDay}`);
    setEl("modalDate", `B\xE1o c\xE1o ng\xE0y ${item.date}`);
    setEl("modalRevenue", `${fmt(item.revenue)}k`);
    setEl("modalCumulative", `${fmt(item.cumulative)}k`);
    setEl("modalOrders", `${item.orders} \u0111\u01A1n`);
    setEl("modalDroppedOrders", `${item.droppedOrders || 0} \u0111\u01A1n`);
    setEl("modalDeduction", `${item.deduction || 0}k`);
    setEl("modalDisplay", `${item.count3 || 0} / ${item.count5 || 0}`);
    setEl("modalReportText", item.reportText || "(Kh\xF4ng c\xF3 v\u0103n b\u1EA3n)");
    setEl("modalRawText", item.rawText || "(Kh\xF4ng c\xF3 \u0111\u01A1n g\u1ED1c)");
    const droppedBox = document.getElementById("modalDroppedBox");
    const droppedRaw = document.getElementById("modalDroppedRawText");
    if (item.droppedText && item.droppedText.trim()) {
      if (droppedBox) droppedBox.classList.remove("hidden");
      if (droppedRaw) droppedRaw.innerText = item.droppedText;
    } else {
      if (droppedBox) droppedBox.classList.add("hidden");
      if (droppedRaw) droppedRaw.innerText = "";
    }
    const modal = document.getElementById("detailModal");
    const sheet = document.getElementById("detailModalSheet");
    if (modal) modal.classList.add("modal-bg-open");
    if (sheet) setTimeout(() => sheet.classList.add("sheet-open"), 10);
  }
  function closeDetailModal() {
    const modal = document.getElementById("detailModal");
    const sheet = document.getElementById("detailModalSheet");
    if (sheet) sheet.classList.remove("sheet-open");
    if (modal) setTimeout(() => modal.classList.remove("modal-bg-open"), 300);
  }
  function initModal() {
    const btnClose = document.getElementById("btnCloseModal");
    if (btnClose) btnClose.addEventListener("click", closeDetailModal);
    const modal = document.getElementById("detailModal");
    if (modal) {
      modal.addEventListener("click", (e) => {
        if (e.target === modal) closeDetailModal();
      });
    }
    const btnCopyReport = document.getElementById("btnModalCopyReport");
    if (btnCopyReport) {
      btnCopyReport.addEventListener("click", () => {
        if (currentModalItem?.reportText) copyToClipboard(currentModalItem.reportText);
      });
    }
    const btnCopyRaw = document.getElementById("btnModalCopyRaw");
    if (btnCopyRaw) {
      btnCopyRaw.addEventListener("click", () => {
        if (currentModalItem?.rawText) copyToClipboard(currentModalItem.rawText);
      });
    }
  }

  // src/core/parser.js
  function splitOrders(text) {
    const orderRegex = /(?:đơn\s*(?:hàng|rớt|hoàn|hủy|huỷ)?|đh|dh)\s*(?:\d+[:\s\.\-]|[:\.\-]|\d+\b)/gi;
    const matches = [];
    let match;
    while ((match = orderRegex.exec(text)) !== null) {
      matches.push(match.index);
    }
    if (matches.length === 0) return [text];
    const orders = [];
    for (let i = 0; i < matches.length; i++) {
      const start = matches[i];
      const end = i === matches.length - 1 ? text.length : matches[i + 1];
      orders.push(text.substring(start, end));
    }
    return orders;
  }
  function parsePrice(str) {
    if (!str) return 0;
    const s = str.trim();
    if (/^\d+[.,]\d{3}$/.test(s)) {
      return parseFloat(s.replace(/[.,]/g, ""));
    }
    return parseFloat(s.replace(/,/g, "."));
  }
  function detectDiscount(text) {
    const hasCk5 = /(?:ck|chiết\s*khấu|chiet\s*khau)[\s:]*5(?:\%|\b)/i.test(text);
    const hasCk3 = /(?:ck|chiết\s*khấu|chiet\s*khau)[\s:]*3(?:\%|\b)/i.test(text);
    if (hasCk5) return 5;
    if (hasCk3) return 3;
    return 0;
  }
  function parseDateFromText(text) {
    const textMatch = text.match(/ngày\s+(\d{1,2})\s+tháng\s+(\d{1,2})(?:\s+năm\s+(\d{2,4}))?/i);
    if (textMatch) {
      const d = parseInt(textMatch[1]);
      const m = parseInt(textMatch[2]);
      let y = textMatch[3] ? parseInt(textMatch[3]) : (/* @__PURE__ */ new Date()).getFullYear();
      if (y < 100) y += 2e3;
      return { d, m, y };
    }
    const numMatch = text.match(/(?:ngày\s+)?(\d{1,2})[\/\-\.](\d{1,2})(?:[\/\-\.](\d{2,4}))?/i);
    if (numMatch) {
      const d = parseInt(numMatch[1]);
      const m = parseInt(numMatch[2]);
      let y = numMatch[3] ? parseInt(numMatch[3]) : (/* @__PURE__ */ new Date()).getFullYear();
      if (y < 100) y += 2e3;
      return { d, m, y };
    }
    return null;
  }
  function createItemRegex() {
    return /(\d+)\s*(?:bành|lốc|thùng|cuộn|gói|hộp|bao|ram|cây|kg|xấp|banh|loc|thung|cuon|goi|hop)?\s*[x*]\s*([\d\.,]+)/gi;
  }
  function parseOrdersSummary(text) {
    if (!text || !text.trim()) {
      return { totalRevenue: 0, count3: 0, count5: 0, validOrderCount: 0 };
    }
    const orders = splitOrders(text);
    let totalRevenue = 0;
    let count3 = 0;
    let count5 = 0;
    let validOrderCount = 0;
    const itemRegex = createItemRegex();
    orders.forEach((orderText) => {
      let orderTotal = 0;
      let hasItems = false;
      itemRegex.lastIndex = 0;
      let itemMatch;
      while ((itemMatch = itemRegex.exec(orderText)) !== null) {
        hasItems = true;
        const qty = parseInt(itemMatch[1]);
        const price = parsePrice(itemMatch[2]);
        if (!isNaN(qty) && !isNaN(price)) orderTotal += qty * price;
      }
      if (hasItems) {
        validOrderCount++;
        const ck = detectDiscount(orderText);
        if (ck === 5) {
          orderTotal *= 0.95;
          count5++;
        } else if (ck === 3) {
          orderTotal *= 0.97;
          count3++;
        }
        totalRevenue += orderTotal;
      }
    });
    return { totalRevenue, count3, count5, validOrderCount };
  }

  // src/core/date-utils.js
  function calculateNextDay(d, m, y) {
    const isLeap = y % 400 === 0 || y % 4 === 0 && y % 100 !== 0;
    const daysInMonth = [0, 31, isLeap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    let nextD = d + 1;
    let nextM = m;
    let nextY = y;
    if (nextD > daysInMonth[m]) {
      nextD = 1;
      nextM = m + 1;
      if (nextM > 12) {
        nextM = 1;
        nextY = y + 1;
      }
    }
    return { d: nextD, m: nextM, y: nextY, isFirstOfMonth: nextD === 1 };
  }

  // src/core/reporter.js
  function generateReportText({
    dateStr,
    workDay,
    kpiStandardDays,
    netRevenue,
    newCumulative,
    kpiMonthRevenue,
    kpiDayRevenue,
    validOrderCount,
    newOrders,
    kpiTotalOrders,
    count3,
    count5,
    staffName
  }) {
    const timeProgress = Math.round(workDay / kpiStandardDays * 100);
    const monthProgress = Math.round(newCumulative / kpiMonthRevenue * 100);
    const dayProgress = Math.round(netRevenue / kpiDayRevenue * 100);
    const orderProgress = Math.round(newOrders / kpiTotalOrders * 100);
    let reportText = `B\xE1o c\xE1o b\xE1n h\xE0ng ng\xE0y:      ${dateStr}
`;
    reportText += `- NV: ${staffName}
`;
    reportText += `- Ti\u1EBFn \u0111\u1ED9 th\u1EDDi gian : ${workDay}/${kpiStandardDays}/${timeProgress}%
`;
    reportText += `- DS  b\xE1n gi\u1EA5y : ${fmt(netRevenue)}/${fmt(newCumulative)}/${fmtMonthKPI(kpiMonthRevenue)}
`;
    reportText += `- DS ng\xE0y : ${fmt(netRevenue)}/${kpiDayRevenue}/${dayProgress}%
`;
    reportText += `- Ti\u1EBFn \u0111\u1ED9 % \u0111\u1EA1t: ${monthProgress}%
`;
    reportText += `- \u0110\u01A1n h\xE0ng: ${validOrderCount}/${newOrders}/${kpiTotalOrders}/${orderProgress}%
`;
    reportText += `- Tr\u01B0ng b\xE0y 3%: ${count3 > 0 ? count3 : "o"}`;
    if (count5 > 0) reportText += `
- Tr\u01B0ng b\xE0y 5%: ${count5}`;
    return reportText;
  }

  // src/ui/views/report-view.js
  var historyData = [];
  var lastCalculatedRecord = null;
  function getHistoryData() {
    return historyData;
  }
  function setHistoryData(data) {
    historyData = data;
  }
  function initReportView(callbacks) {
    historyData = loadHistory();
    const today = /* @__PURE__ */ new Date();
    setReportDate(today, callbacks);
    const elDate = document.getElementById("reportDate");
    if (elDate) {
      elDate.addEventListener("change", (e) => {
        if (e.target.value) {
          const parts = e.target.value.split("-");
          handleDateChange(
            new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2])),
            callbacks
          );
        }
      });
    }
    const btnNext = document.getElementById("btnNextDay");
    if (btnNext) {
      btnNext.addEventListener("click", () => {
        const val = document.getElementById("reportDate")?.value;
        if (!val) return;
        const parts = val.split("-");
        const next = calculateNextDay(parseInt(parts[2]), parseInt(parts[1]), parseInt(parts[0]));
        setReportDate(new Date(next.y, next.m - 1, next.d), callbacks);
      });
    }
    const btnParse = document.getElementById("btnParseDate");
    if (btnParse) {
      btnParse.addEventListener("click", () => {
        const text = document.getElementById("rawText")?.value || "";
        const res = parseDateFromText(text);
        if (res && res.d > 0 && res.d <= 31 && res.m > 0 && res.m <= 12) {
          setReportDate(new Date(res.y, res.m - 1, res.d), callbacks);
        } else {
          showToast("Kh\xF4ng t\xECm th\u1EA5y ng\xE0y h\u1EE3p l\u1EC7!", true);
        }
      });
    }
    const elDropped = document.getElementById("droppedOrdersText");
    if (elDropped) {
      elDropped.addEventListener("input", updateDroppedNotice);
    }
    const btnCalc = document.getElementById("btnCalculate");
    if (btnCalc) {
      btnCalc.addEventListener("click", () => {
        calculateReport(callbacks);
      });
    }
    const btnContinue = document.getElementById("btnContinueNextDay");
    if (btnContinue) {
      btnContinue.addEventListener("click", () => {
        setupNextDayReport(callbacks);
      });
    }
    const btnReset = document.getElementById("btnResetForm");
    if (btnReset) {
      btnReset.addEventListener("click", resetReportForm);
    }
    const btnCopy = document.getElementById("btnCopy");
    if (btnCopy) {
      btnCopy.addEventListener("click", () => {
        const text = document.getElementById("reportOutput")?.innerText || "";
        copyToClipboard(text);
        const icon = document.getElementById("copy-icon");
        const label = document.getElementById("copy-text");
        if (icon && label) {
          icon.textContent = "check";
          label.textContent = "\u0110\xE3 ch\xE9p!";
          setTimeout(() => {
            icon.textContent = "content_copy";
            label.textContent = "Sao ch\xE9p";
          }, 2e3);
        }
      });
    }
  }
  function setReportDate(dateObj, callbacks) {
    const offset = dateObj.getTimezoneOffset();
    const localDate = new Date(dateObj.getTime() - offset * 60 * 1e3);
    const elDate = document.getElementById("reportDate");
    if (elDate) elDate.value = localDate.toISOString().split("T")[0];
    handleDateChange(dateObj, callbacks);
  }
  function handleDateChange(dateObj, callbacks) {
    const d = dateObj.getDate();
    const m = dateObj.getMonth() + 1;
    const y = dateObj.getFullYear();
    const notice = document.getElementById("dateNotice");
    if (notice) notice.innerText = `\u2705 \u0110\xE3 ch\u1ECDn: Ng\xE0y ${d} th\xE1ng ${m} n\u0103m ${y}`;
    if (callbacks?.updateMonthlyWidgets) callbacks.updateMonthlyWidgets(m, y);
    if (callbacks?.updateHeaderMonthBadge) callbacks.updateHeaderMonthBadge(m, y);
    autoFillNextDayData(dateObj);
  }
  function autoFillNextDayData(dateObj) {
    const targetMonth = dateObj.getMonth() + 1;
    const targetYear = dateObj.getFullYear();
    if (dateObj.getDate() === 1) {
      setField("workDay", 1);
      setField("cumulative", 0);
      setField("cumulativeOrders", 0);
      return;
    }
    const reqTime = dateObj.getTime();
    let latestReport = null;
    let maxTime = 0;
    (historyData || []).forEach((item) => {
      if (!item || !item.date || typeof item.date !== "string") return;
      const parts = item.date.split("/");
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
      setField("workDay", parseInt(latestReport.workDay) + 1);
      setField("cumulative", Math.round(latestReport.cumulative));
      setField("cumulativeOrders", latestReport.cumulativeOrders);
    } else {
      setField("workDay", 1);
      setField("cumulative", 0);
      setField("cumulativeOrders", 0);
    }
  }
  function calculateReport(callbacks) {
    const text = document.getElementById("rawText")?.value || "";
    if (!text.trim()) {
      showToast("Vui l\xF2ng nh\u1EADp n\u1ED9i dung \u0111\u01A1n h\xE0ng!", true);
      return;
    }
    const dateParts = document.getElementById("reportDate")?.value?.split("-") || [];
    if (dateParts.length < 3) {
      showToast("Ng\xE0y b\xE1o c\xE1o kh\xF4ng h\u1EE3p l\u1EC7!", true);
      return;
    }
    const dateStr = `${parseInt(dateParts[2])}/${parseInt(dateParts[1])}/${parseInt(dateParts[0])}`;
    const existingRecord = (historyData || []).find((h) => h.date === dateStr);
    if (existingRecord) {
      const isDifferentText = existingRecord.rawText && existingRecord.rawText.trim() !== text.trim();
      if (isDifferentText) {
        const nextDay = calculateNextDay(parseInt(dateParts[2]), parseInt(dateParts[1]), parseInt(dateParts[0]));
        const nextDayStr = `${nextDay.d}/${nextDay.m}/${nextDay.y}`;
        const userWantsUpdate = typeof window !== "undefined" && typeof window.confirm === "function" ? window.confirm(
          `\u26A0\uFE0F B\xE1o c\xE1o ng\xE0y ${dateStr} \u0111\xE3 t\u1ED3n t\u1EA1i trong L\u1ECBch S\u1EED!

\u2022 Nh\u1EA5n [OK] n\u1EBFu b\u1EA1n mu\u1ED1n C\u1EACP NH\u1EACT L\u1EA0I ng\xE0y ${dateStr}.
\u2022 Nh\u1EA5n [H\u1EE7y / Cancel] \u0111\u1EC3 T\u1EF0 \u0110\u1ED8NG L\u01AFU SANG NG\xC0Y TI\u1EBEP THEO (${nextDayStr}) v\xE0 gi\u1EEF nguy\xEAn c\u1EA3 2 ng\xE0y trong L\u1ECBch S\u1EED.`
        ) : true;
        if (!userWantsUpdate) {
          const nextDateObj = new Date(nextDay.y, nextDay.m - 1, nextDay.d);
          setReportDate(nextDateObj, callbacks);
          setField("workDay", (parseInt(existingRecord.workDay) || 0) + 1);
          setField("cumulative", Math.round(existingRecord.cumulative || 0));
          setField("cumulativeOrders", existingRecord.cumulativeOrders || 0);
          calculateReport(callbacks);
          return;
        }
      }
    }
    const dayOrders = parseOrdersSummary(text);
    let totalRevenue = dayOrders.totalRevenue;
    let count3 = dayOrders.count3;
    let count5 = dayOrders.count5;
    const validOrderCount = dayOrders.validOrderCount;
    const droppedText = document.getElementById("droppedOrdersText")?.value || "";
    const droppedOrders = parseOrdersSummary(droppedText);
    const droppedCount = droppedOrders.validOrderCount;
    const droppedRevenue = droppedOrders.totalRevenue;
    const netDailyOrders = Math.max(0, validOrderCount - droppedCount);
    if (droppedOrders.count3 > 0) count3 = Math.max(0, count3 - droppedOrders.count3);
    if (droppedOrders.count5 > 0) count5 = Math.max(0, count5 - droppedOrders.count5);
    const manualDeduction = Math.round(parseFloat(document.getElementById("deduction")?.value) || 0);
    const totalDeduction = Math.round(droppedRevenue + manualDeduction);
    const netRevenue = Math.round(totalRevenue - totalDeduction);
    const prevCumulative = Math.round(parseFloat(document.getElementById("cumulative")?.value) || 0);
    const newCumulative = Math.round(prevCumulative + netRevenue);
    const prevOrders = parseInt(document.getElementById("cumulativeOrders")?.value) || 0;
    const newOrders = prevOrders + netDailyOrders;
    const workDay = parseInt(document.getElementById("workDay")?.value) || 1;
    const kpiStandardDays = parseInt(document.getElementById("kpiStandardDays")?.value) || DEFAULT_KPI.kpiStandardDays;
    const kpiMonthRevenue = Math.round(parseFloat(document.getElementById("kpiMonthRevenue")?.value) || DEFAULT_KPI.kpiMonthRevenue);
    const kpiDayRevenue = Math.round(parseFloat(document.getElementById("kpiDayRevenue")?.value) || DEFAULT_KPI.kpiDayRevenue);
    const kpiTotalOrders = parseInt(document.getElementById("kpiTotalOrders")?.value) || DEFAULT_KPI.kpiTotalOrders;
    const staffName = (document.getElementById("employeeName")?.value || "").trim() || DEFAULT_KPI.employeeName;
    const reportText = generateReportText({
      dateStr,
      workDay,
      kpiStandardDays,
      netRevenue,
      newCumulative,
      kpiMonthRevenue,
      kpiDayRevenue,
      validOrderCount: netDailyOrders,
      newOrders,
      kpiTotalOrders,
      count3,
      count5,
      staffName
    });
    const elOutput = document.getElementById("reportOutput");
    if (elOutput) elOutput.innerText = reportText;
    const resultCard = document.getElementById("reportResultCard");
    if (resultCard) {
      resultCard.classList.remove("hidden");
      resultCard.classList.remove("result-reveal-pop");
      void resultCard.offsetWidth;
      resultCard.classList.add("result-reveal-pop");
      resultCard.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
    const record = {
      id: Date.now(),
      date: dateStr,
      employeeName: staffName,
      workDay,
      orders: netDailyOrders,
      rawOrderCount: validOrderCount,
      droppedOrders: droppedCount,
      revenue: Math.round(netRevenue),
      deduction: totalDeduction,
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
    historyData = historyData.filter((h) => h.date !== dateStr);
    historyData.push(record);
    historyData.sort((a, b) => {
      const da = a.date.split("/");
      const db = b.date.split("/");
      const dA = new Date(parseInt(da[2]), parseInt(da[1]) - 1, parseInt(da[0])).getTime();
      const dB = new Date(parseInt(db[2]), parseInt(db[1]) - 1, parseInt(db[0])).getTime();
      return dB === dA ? b.id - a.id : dB - dA;
    });
    saveHistory(historyData);
    if (callbacks?.onCalculated) callbacks.onCalculated();
    if (callbacks?.updateMonthlyWidgets) {
      callbacks.updateMonthlyWidgets(parseInt(dateParts[1]), parseInt(dateParts[0]));
    }
    copyToClipboard(reportText, false);
  }
  function setupNextDayReport(callbacks) {
    const val = document.getElementById("reportDate")?.value;
    if (!val) return;
    const parts = val.split("-");
    const next = calculateNextDay(parseInt(parts[2]), parseInt(parts[1]), parseInt(parts[0]));
    const nextDateObj = new Date(next.y, next.m - 1, next.d);
    setReportDate(nextDateObj, callbacks);
    if (lastCalculatedRecord) {
      setField("workDay", (parseInt(lastCalculatedRecord.workDay) || 0) + 1);
      setField("cumulative", Math.round(lastCalculatedRecord.cumulative || 0));
      setField("cumulativeOrders", lastCalculatedRecord.cumulativeOrders || 0);
    }
    setField("deduction", 0);
    const rawEl = document.getElementById("rawText");
    if (rawEl) {
      rawEl.value = "";
      rawEl.focus();
    }
    const droppedEl = document.getElementById("droppedOrdersText");
    if (droppedEl) droppedEl.value = "";
    const droppedNotice = document.getElementById("droppedNotice");
    if (droppedNotice) droppedNotice.innerText = "";
    const resultCard = document.getElementById("reportResultCard");
    if (resultCard) {
      resultCard.classList.add("hidden");
    }
    const anchor = document.getElementById("rawText");
    if (anchor) {
      anchor.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    showToast(`\u0110\xE3 chuy\u1EC3n sang ng\xE0y ${next.d}/${next.m}/${next.y}! H\xE3y d\xE1n \u0111\u01A1n h\xE0ng m\u1EDBi.`);
  }
  function resetReportForm() {
    const rawEl = document.getElementById("rawText");
    if (rawEl) {
      rawEl.value = "";
      rawEl.focus();
    }
    setField("deduction", 0);
    const droppedEl = document.getElementById("droppedOrdersText");
    if (droppedEl) droppedEl.value = "";
    const droppedNotice = document.getElementById("droppedNotice");
    if (droppedNotice) droppedNotice.innerText = "";
    const resultCard = document.getElementById("reportResultCard");
    if (resultCard) {
      resultCard.classList.add("hidden");
    }
    showToast("\u0110\xE3 l\xE0m m\u1EDBi khung nh\u1EADp \u0111\u01A1n!");
  }
  function updateDroppedNotice() {
    const droppedText = document.getElementById("droppedOrdersText")?.value || "";
    const notice = document.getElementById("droppedNotice");
    if (!notice) return;
    if (!droppedText.trim()) {
      notice.innerText = "";
      return;
    }
    const summary = parseOrdersSummary(droppedText);
    if (summary.validOrderCount > 0) {
      notice.innerText = `\u26A0\uFE0F Nh\u1EADn di\u1EC7n: ${summary.validOrderCount} \u0111\u01A1n r\u1EDBt (-${fmt(summary.totalRevenue)}k)`;
    } else {
      notice.innerText = "";
    }
  }
  function updateMonthlyWidgets(month, year) {
    let count3 = 0;
    let count5 = 0;
    (historyData || []).forEach((item) => {
      if (!item || !item.date || typeof item.date !== "string") return;
      const parts = item.date.split("/");
      if (parts.length < 3) return;
      const [, m, y] = parts;
      if (parseInt(m) === month && parseInt(y) === year) {
        count3 += item.count3 || 0;
        count5 += item.count5 || 0;
      }
    });
    const el3 = document.getElementById("display3Count");
    const el5 = document.getElementById("display5Count");
    if (el3) {
      const prev3 = parseInt(el3.innerText) || 0;
      animateCount(el3, prev3, count3);
    }
    if (el5) {
      const prev5 = parseInt(el5.innerText) || 0;
      animateCount(el5, prev5, count5);
    }
    const kpiMonthRevenue = parseInt(localStorage.getItem("kpiMonthRevenue")) || DEFAULT_KPI.kpiMonthRevenue;
    let totalCum = 0;
    (historyData || []).forEach((item) => {
      if (!item || !item.date || typeof item.date !== "string") return;
      const parts = item.date.split("/");
      if (parts.length < 3) return;
      const [, m, y] = parts;
      if (parseInt(m) === month && parseInt(y) === year) {
        totalCum = Math.max(totalCum, item.cumulative || 0);
      }
    });
    const pct = Math.min(100, Math.round(totalCum / kpiMonthRevenue * 100));
    const progressBar = document.getElementById("mini-progress-bar");
    const progressLabel = document.getElementById("mini-month-progress");
    const cumulativeLabel = document.getElementById("mini-cumulative-label");
    const kpiLabel = document.getElementById("mini-kpi-label");
    if (progressBar) progressBar.style.width = pct + "%";
    if (progressLabel) {
      const prevPct = parseInt(progressLabel.innerText) || 0;
      animateCount(progressLabel, prevPct, pct, 380, (n) => `${n}%`);
    }
    if (cumulativeLabel) cumulativeLabel.innerText = `L\u0169y k\u1EBF: ${fmtK(totalCum)}`;
    if (kpiLabel) kpiLabel.innerText = `M\u1EE5c ti\xEAu: ${fmtK(kpiMonthRevenue)}`;
  }
  function updateHeaderMonthBadge(m, y) {
    const badge = document.getElementById("header-month-badge");
    if (badge) badge.innerText = `T${m}/${y}`;
    const displayBadge = document.getElementById("display-month-badge");
    if (displayBadge) displayBadge.innerText = `Th\xE1ng ${m}/${y}`;
  }
  function setField(id, val) {
    const el = document.getElementById(id);
    if (el) el.value = val;
  }

  // src/ui/views/history-view.js
  function updateHistoryUI(historyData2) {
    const list = document.getElementById("historyList");
    if (!list) return;
    list.innerHTML = "";
    const data = Array.isArray(historyData2) ? historyData2 : [];
    if (data.length === 0) {
      list.innerHTML = '<div class="text-center text-on-surface-variant font-body-md py-8">Ch\u01B0a c\xF3 b\xE1o c\xE1o n\xE0o.</div>';
      return;
    }
    data.forEach((item, index) => {
      if (!item || !item.date) return;
      const div = document.createElement("div");
      div.className = "history-card-in bg-surface-container-lowest rounded-xl p-space-md shadow-sm border border-outline-variant/20 flex flex-col gap-space-sm active:bg-surface-container-low transition-colors cursor-pointer relative overflow-hidden";
      if (div.style) div.style.animationDelay = `${Math.min(index * 45, 300)}ms`;
      const today = /* @__PURE__ */ new Date();
      const todayStr = `${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`;
      const isToday = item.date === todayStr;
      div.innerHTML = `
      ${isToday ? '<div class="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-l-xl"></div>' : ""}
      <div class="flex items-center justify-between ${isToday ? "pl-2" : ""}">
        <div class="flex items-center gap-space-xs">
          <span class="font-headline-sm text-headline-sm text-on-surface font-bold">${item.date}</span>
          ${isToday ? '<span class="px-2 py-0.5 rounded-full bg-primary/10 text-primary font-label-sm text-label-sm font-bold shadow-sm">H\xF4m nay</span>' : ""}
          <span class="font-label-sm text-label-sm text-on-surface-variant">\u2022 Ng\xE0y c\xF4ng ${item.workDay}</span>
        </div>
        <div class="flex items-center gap-1 text-secondary font-label-sm text-label-sm font-semibold">
          <span class="material-symbols-outlined text-[16px]">check_circle</span>
          \u0110\xE3 l\u01B0u
        </div>
      </div>
      <div class="grid grid-cols-2 gap-space-sm bg-surface-container-low rounded-lg px-space-sm py-space-xs">
        <div>
          <span class="font-label-sm text-label-sm text-on-surface-variant block">Doanh s\u1ED1 ng\xE0y</span>
          <span class="font-headline-sm text-headline-sm text-primary font-bold font-mono">${fmt(item.revenue)}k</span>
        </div>
        <div>
          <span class="font-label-sm text-label-sm text-on-surface-variant block">L\u0169y ti\u1EBFn th\xE1ng</span>
          <span class="font-label-lg text-label-lg text-on-surface font-semibold font-mono">${fmt(item.cumulative)}k</span>
        </div>
      </div>
      <div class="flex items-center justify-between">
        <span class="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-1">
          <span class="material-symbols-outlined text-[16px] text-outline">shopping_bag</span>
          ${item.orders} \u0111\u01A1n ${item.droppedOrders > 0 ? `<span class="text-error font-medium">(-${item.droppedOrders} r\u1EDBt)</span>` : ""}| TB: ${item.count3 || 0}(3%) ${item.count5 || 0}(5%)
        </span>
        <span class="material-symbols-outlined text-on-surface-variant text-[18px] group-hover:translate-x-1 transition-transform">chevron_right</span>
      </div>
    `;
      div.addEventListener("click", () => openDetailModal(item));
      list.appendChild(div);
    });
  }
  function refreshHistoryView(historyData2) {
    const data = Array.isArray(historyData2) ? historyData2 : [];
    updateHistoryUI(data);
    let m, y;
    if (data.length > 0 && data[0]?.date) {
      const pts = data[0].date.split("/");
      if (pts.length >= 3) {
        m = parseInt(pts[1]);
        y = parseInt(pts[2]);
      }
    }
    if (!m || !y) {
      const today = /* @__PURE__ */ new Date();
      m = today.getMonth() + 1;
      y = today.getFullYear();
    }
    const kpiMonthRevenue = parseInt(localStorage.getItem("kpiMonthRevenue")) || DEFAULT_KPI.kpiMonthRevenue;
    const monthItems = data.filter((h) => {
      if (!h || !h.date || typeof h.date !== "string") return false;
      const pts = h.date.split("/");
      return pts.length >= 2 && parseInt(pts[1]) === m && parseInt(pts[2]) === y;
    });
    const totalCum = monthItems.reduce((s, h) => Math.max(s, h.cumulative || 0), 0);
    const pct = Math.min(100, Math.round(totalCum / kpiMonthRevenue * 100));
    const setEl = (id, text) => {
      const el = document.getElementById(id);
      if (el) el.innerText = text;
    };
    setEl("history-month-title", `Th\xE1ng ${m}/${y}`);
    setEl("history-record-count", `${monthItems.length} B\xE1o C\xE1o`);
    setEl("history-total-rev", fmtK(totalCum));
    setEl("history-days-worked", `${monthItems.length} ng\xE0y b\xE1o c\xE1o`);
    setEl("history-progress-pct", `Ti\u1EBFn \u0111\u1ED9: ${pct}%`);
    const bar = document.getElementById("history-progress-bar");
    if (bar) bar.style.width = pct + "%";
  }

  // src/ui/views/settings-view.js
  function initSettingsView(callbacks) {
    Object.keys(DEFAULT_KPI).forEach((key) => {
      const val = loadKPI(key);
      const el = document.getElementById(key);
      if (el) {
        el.value = val;
        el.addEventListener("input", (e) => {
          saveKPI(key, e.target.value);
          if (key === "employeeName") {
            const settingsDisplay2 = document.getElementById("settings-emp-display");
            if (settingsDisplay2) settingsDisplay2.innerText = e.target.value;
          }
        });
      }
    });
    const savedName = String(loadKPI("employeeName") || DEFAULT_KPI.employeeName);
    const settingsDisplay = document.getElementById("settings-emp-display");
    if (settingsDisplay) settingsDisplay.innerText = savedName;
    updateAutoNote();
    const elMonth = document.getElementById("kpiMonthRevenue");
    const elDays = document.getElementById("kpiStandardDays");
    if (elMonth) elMonth.addEventListener("input", updateAutoNote);
    if (elDays) elDays.addEventListener("input", updateAutoNote);
    const btnAutoCalc = document.getElementById("btnAutoCalc");
    if (btnAutoCalc) {
      btnAutoCalc.addEventListener("click", () => {
        const m = parseFloat(document.getElementById("kpiMonthRevenue")?.value) || 0;
        const d = parseFloat(document.getElementById("kpiStandardDays")?.value) || 25;
        const pace = Math.round(m / (d || 1));
        const elDay = document.getElementById("kpiDayRevenue");
        if (elDay) elDay.value = pace;
        updateAutoNote();
        showToast(`DS ng\xE0y t\u1EF1 t\xEDnh: ${pace.toLocaleString("vi-VN")}k`);
      });
    }
    const btnSave = document.getElementById("btnSaveKPI");
    if (btnSave) {
      btnSave.addEventListener("click", () => {
        ["kpiMonthRevenue", "kpiDayRevenue", "kpiTotalOrders", "kpiStandardDays"].forEach((key) => {
          const el = document.getElementById(key);
          if (el) saveKPI(key, el.value);
        });
        const orig = btnSave.innerHTML;
        btnSave.innerHTML = '<span class="material-symbols-outlined text-[20px]">check</span><span>\u0110\xE3 L\u01B0u!</span>';
        btnSave.disabled = true;
        setTimeout(() => {
          btnSave.innerHTML = orig;
          btnSave.disabled = false;
        }, 2e3);
        showToast("\u0110\xE3 l\u01B0u c\xE0i \u0111\u1EB7t ch\u1EC9 ti\xEAu!");
        const today = /* @__PURE__ */ new Date();
        if (callbacks?.updateMonthlyWidgets) {
          callbacks.updateMonthlyWidgets(today.getMonth() + 1, today.getFullYear());
        }
      });
    }
  }
  function updateAutoNote() {
    const m = parseFloat(document.getElementById("kpiMonthRevenue")?.value) || 0;
    const d = parseFloat(document.getElementById("kpiStandardDays")?.value) || 25;
    const pace = Math.round(m / (d || 1));
    const note = document.getElementById("daily-auto-note");
    if (note) note.textContent = `\u2248 ${pace.toLocaleString("vi-VN")}k (t\u1EF1 t\xEDnh)`;
    const dongNote = document.getElementById("kpi-month-dong-note");
    if (dongNote) {
      const dong = Math.round(m * 1e3);
      const dongStr = dong.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      dongNote.textContent = `=${dongStr} \u0111`;
    }
  }

  // src/main.js
  function init() {
    const callbacks = {
      onCalculated: () => {
        updateHistoryUI(getHistoryData());
      },
      updateMonthlyWidgets,
      updateHeaderMonthBadge
    };
    initReportView(callbacks);
    initSettingsView({ updateMonthlyWidgets });
    initNavigation(() => refreshHistoryView(getHistoryData()));
    initModal();
    initRippleEffects();
    updateHistoryUI(getHistoryData());
    const today = /* @__PURE__ */ new Date();
    updateMonthlyWidgets(today.getMonth() + 1, today.getFullYear());
    updateHeaderMonthBadge(today.getMonth() + 1, today.getFullYear());
    const btnExport = document.getElementById("btnExportCSV");
    if (btnExport) {
      btnExport.addEventListener("click", () => {
        const data = getHistoryData();
        if (data.length === 0) {
          showToast("Ch\u01B0a c\xF3 l\u1ECBch s\u1EED \u0111\u1EC3 xu\u1EA5t!", true);
          return;
        }
        const success = exportCSV(data);
        if (success) showToast("\u0110\xE3 t\u1EA3i file CSV!");
      });
    }
    const btnClear = document.getElementById("btnClearHistory");
    if (btnClear) {
      btnClear.addEventListener("click", () => {
        if (confirm("\u26A0\uFE0F X\xF3a to\xE0n b\u1ED9 l\u1ECBch s\u1EED? Kh\xF4ng th\u1EC3 ho\xE0n t\xE1c.")) {
          setHistoryData([]);
          clearHistory();
          updateHistoryUI([]);
          refreshHistoryView([]);
          const dateParts = document.getElementById("reportDate")?.value?.split("-") || [];
          if (dateParts.length === 3) {
            updateMonthlyWidgets(parseInt(dateParts[1]), parseInt(dateParts[0]));
          }
          showToast("\u0110\xE3 x\xF3a to\xE0n b\u1ED9 l\u1ECBch s\u1EED!");
        }
      });
    }
    registerServiceWorker();
  }
  function registerServiceWorker() {
    try {
      if (window.location.protocol !== "file:" && "serviceWorker" in navigator) {
        window.addEventListener("load", () => {
          navigator.serviceWorker.register("./sw.js").catch(() => {
          });
        });
      }
    } catch {
    }
  }
  init();
})();
