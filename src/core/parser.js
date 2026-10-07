/**
 * @module parser
 * Regex-based order parsing engine for Zalo/Telegram sales messages.
 * All regex patterns are BUSINESS INVARIANTS — do NOT modify.
 * Pure functions — zero DOM dependency.
 */

/**
 * Split raw Zalo text into individual order blocks.
 * Recognises headers like: "Đơn 1:", "đơn hàng 2:", "đh 3:", "dh 4", "Đơn:", etc.
 * @param {string} text – raw message text
 * @returns {string[]} array of order text blocks
 */
export function splitOrders(text) {
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

/**
 * Parse a price string that may use Vietnamese formatting.
 * Handles: "120", "35.5", "12,5", "1.200", "1,200", "0.5"
 * @param {string} str – raw price string
 * @returns {number} parsed numeric value
 */
export function parsePrice(str) {
  if (!str) return 0;
  const s = str.trim();
  // Pattern: digits + single separator + exactly 3 digits → thousands separator
  if (/^\d+[.,]\d{3}$/.test(s)) {
    return parseFloat(s.replace(/[.,]/g, ''));
  }
  // Otherwise treat comma as decimal separator
  return parseFloat(s.replace(/,/g, '.'));
}

/**
 * Detect discount percentage from order text.
 * Recognises: "ck 3%", "ck3", "chiết khấu 5%", "chiet khau 3%", etc.
 * @param {string} text – single order text block
 * @returns {0|3|5} discount percentage
 */
export function detectDiscount(text) {
  const hasCk5 = /(?:ck|chiết\s*khấu|chiet\s*khau)[\s:]*5(?:\%|\b)/i.test(text);
  const hasCk3 = /(?:ck|chiết\s*khấu|chiet\s*khau)[\s:]*3(?:\%|\b)/i.test(text);
  if (hasCk5) return 5;
  if (hasCk3) return 3;
  return 0;
}

/**
 * Extract a date from free-form Vietnamese text.
 * Supports: "ngày 28 tháng 9 năm 2026", "28/9/2026", "28-9-2026", "28.9.2026", "28/9"
 * @param {string} text
 * @returns {{ d: number, m: number, y: number }|null}
 */
export function parseDateFromText(text) {
  // Pattern 1: "ngày X tháng Y [năm Z]"
  const textMatch = text.match(/ngày\s+(\d{1,2})\s+tháng\s+(\d{1,2})(?:\s+năm\s+(\d{2,4}))?/i);
  if (textMatch) {
    const d = parseInt(textMatch[1]);
    const m = parseInt(textMatch[2]);
    let y = textMatch[3] ? parseInt(textMatch[3]) : new Date().getFullYear();
    if (y < 100) y += 2000;
    return { d, m, y };
  }
  // Pattern 2: numeric separators "d/m/y" or "d-m-y" or "d.m.y"
  const numMatch = text.match(/(?:ngày\s+)?(\d{1,2})[\/\-\.](\d{1,2})(?:[\/\-\.](\d{2,4}))?/i);
  if (numMatch) {
    const d = parseInt(numMatch[1]);
    const m = parseInt(numMatch[2]);
    let y = numMatch[3] ? parseInt(numMatch[3]) : new Date().getFullYear();
    if (y < 100) y += 2000;
    return { d, m, y };
  }
  return null;
}

/**
 * Item regex for extracting quantity × price from order text.
 * Exported as a factory so each caller gets a fresh regex (no shared lastIndex state).
 * @returns {RegExp}
 */
export function createItemRegex() {
  return /(\d+)\s*(?:bành|lốc|thùng|cuộn|gói|hộp|bao|ram|cây|kg|xấp|banh|loc|thung|cuon|goi|hop)?\s*[x*]\s*([\d\.,]+)/gi;
}

/**
 * Parse orders from text, extracting total revenue, discount counts, and valid order count.
 * Pure function — zero DOM dependency.
 * @param {string} text – raw order text
 * @returns {{ totalRevenue: number, count3: number, count5: number, validOrderCount: number }}
 */
export function parseOrdersSummary(text) {
  if (!text || !text.trim()) {
    return { totalRevenue: 0, count3: 0, count5: 0, validOrderCount: 0 };
  }
  const orders = splitOrders(text);
  let totalRevenue = 0;
  let count3 = 0;
  let count5 = 0;
  let validOrderCount = 0;
  const itemRegex = createItemRegex();

  orders.forEach(orderText => {
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
      if (ck === 5) { orderTotal *= 0.95; count5++; }
      else if (ck === 3) { orderTotal *= 0.97; count3++; }
      totalRevenue += orderTotal;
    }
  });

  return { totalRevenue, count3, count5, validOrderCount };
}
