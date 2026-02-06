function extractRequestId() {
  const href = window.location.href;
  const match = href.match(/(?:[?&]|^)requestId=([^&]+)/i);
  if (match && match[1]) {
    return decodeURIComponent(match[1]);
  }
  return '';
}

function initRequestId() {
  const input = document.getElementById('requestId');
  if (!input) return;

  const value = extractRequestId();
  if (value) {
    input.value = value;
  } else if (!input.value) {
    input.value = generateRequestId();
  }

  applyRequestId(input.value);

  input.addEventListener('input', () => {
    const next = input.value.trim();
    if (next) {
      applyRequestId(next);
    }
  });
}

function getQueryParam(name) {
  const params = new URLSearchParams(window.location.search);
  let value = params.get(name);
  if (!value && window.location.hash.includes('?')) {
    const hashQuery = window.location.hash.split('?')[1];
    const hashParams = new URLSearchParams(hashQuery);
    value = hashParams.get(name);
  }
  if (!value && window.location.hash.startsWith('#')) {
    const hashParams = new URLSearchParams(window.location.hash.slice(1));
    value = hashParams.get(name);
  }
  return value ? decodeURIComponent(value) : '';
}

function generateRequestId() {
  const chunk = () => Math.floor(Math.random() * 0xffff)
    .toString(16)
    .padStart(4, '0');
  return `${chunk()}${chunk()}`;
}

function applyRequestId(value) {
  const elements = document.querySelectorAll('[data-request-id]');
  elements.forEach((el) => {
    const template = el.getAttribute('data-template') || el.textContent;
    if (!el.getAttribute('data-template')) {
      el.setAttribute('data-template', template);
    }
    el.textContent = template.replaceAll('{{requestId}}', value);
  });
}

function isNumeric(value) {
  return /^-?\d+(\.\d+)?$/.test(value);
}

function parseEpoch(value) {
  if (!isNumeric(value)) return null;
  const num = Number(value);
  if (!Number.isFinite(num)) return null;

  if (num > 1e12) {
    return new Date(num);
  }

  if (num > 1e9) {
    return new Date(num * 1000);
  }

  return null;
}

function applyMonthShift(date, amount) {
  const next = new Date(date.getTime());
  const day = next.getDate();
  next.setDate(1);
  next.setMonth(next.getMonth() + amount);
  const maxDay = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
  next.setDate(Math.min(day, maxDay));
  return next;
}

function applyYearShift(date, amount) {
  const next = new Date(date.getTime());
  const day = next.getDate();
  next.setDate(1);
  next.setFullYear(next.getFullYear() + amount);
  const maxDay = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
  next.setDate(Math.min(day, maxDay));
  return next;
}

function roundDown(date, unit) {
  const next = new Date(date.getTime());
  if (unit === 'y') {
    next.setMonth(0, 1);
    next.setHours(0, 0, 0, 0);
    return next;
  }
  if (unit === 'M') {
    next.setDate(1);
    next.setHours(0, 0, 0, 0);
    return next;
  }
  if (unit === 'w') {
    const day = next.getDay();
    const diff = (day + 6) % 7; // Monday start
    next.setDate(next.getDate() - diff);
    next.setHours(0, 0, 0, 0);
    return next;
  }
  if (unit === 'd') {
    next.setHours(0, 0, 0, 0);
    return next;
  }
  if (unit === 'h') {
    next.setMinutes(0, 0, 0);
    return next;
  }
  if (unit === 'm') {
    next.setSeconds(0, 0);
    return next;
  }
  if (unit === 's') {
    next.setMilliseconds(0);
    return next;
  }
  return next;
}

function parseDateMath(value, now) {
  if (!value) return null;
  if (value === 'now') return new Date(now.getTime());

  const baseMatch = value.match(/^now([+-].+)?$/);
  if (!baseMatch) return null;

  let cursor = new Date(now.getTime());
  let remainder = value.slice(3);
  let rounding = null;

  const roundingIndex = remainder.indexOf('/');
  if (roundingIndex >= 0) {
    rounding = remainder.slice(roundingIndex + 1);
    remainder = remainder.slice(0, roundingIndex);
  }

  const opRegex = /([+-])(\d+)([smhdwMy])/g;
  let opMatch;
  while ((opMatch = opRegex.exec(remainder))) {
    const sign = opMatch[1] === '-' ? -1 : 1;
    const amount = Number(opMatch[2]) * sign;
    const unit = opMatch[3];
    if (unit === 's') cursor = new Date(cursor.getTime() + amount * 1000);
    if (unit === 'm') cursor = new Date(cursor.getTime() + amount * 60000);
    if (unit === 'h') cursor = new Date(cursor.getTime() + amount * 3600000);
    if (unit === 'd') cursor = new Date(cursor.getTime() + amount * 86400000);
    if (unit === 'w') cursor = new Date(cursor.getTime() + amount * 7 * 86400000);
    if (unit === 'M') cursor = applyMonthShift(cursor, amount);
    if (unit === 'y') cursor = applyYearShift(cursor, amount);
  }

  if (rounding) {
    cursor = roundDown(cursor, rounding);
  }

  return cursor;
}

function parseTimeValue(value, now) {
  if (!value) return null;

  const epoch = parseEpoch(value);
  if (epoch) return epoch;

  const iso = new Date(value);
  if (!Number.isNaN(iso.getTime()) && /\d{4}-\d{2}-\d{2}/.test(value)) {
    return iso;
  }

  const math = parseDateMath(value, now);
  if (math) return math;

  return null;
}

function pad(value) {
  return String(value).padStart(2, '0');
}

function formatDate(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
}

function describeRange(from, to, rawFrom, rawTo) {
  if (rawFrom && rawTo) {
    const relFrom = /^now/.test(rawFrom);
    const relTo = /^now/.test(rawTo);
    if (relFrom && relTo) {
      return `${rawFrom} → ${rawTo}`;
    }
    if (relFrom && rawTo === 'now') {
      const diff = to.getTime() - from.getTime();
      const hours = diff / 3600000;
      if (Math.abs(hours - 1) < 0.01) return 'Last 1 hour';
      if (Math.abs(hours - 6) < 0.05) return 'Last 6 hours';
      if (Math.abs(hours - 12) < 0.05) return 'Last 12 hours';
      if (Math.abs(hours - 24) < 0.1) return 'Last 24 hours';
      if (Math.abs(hours - 168) < 0.5) return 'Last 7 days';
    }
  }
  return `${formatDate(from)} — ${formatDate(to)}`;
}

function initTimeRange() {
  const label = document.getElementById('timeRangeLabel');
  if (!label) return;

  const rawFrom = getQueryParam('from') || 'now-6h';
  const rawTo = getQueryParam('to') || 'now';
  const now = new Date();
  const from = parseTimeValue(rawFrom, now);
  const to = parseTimeValue(rawTo, now);

  if (!from || !to) {
    label.textContent = 'Last 6 hours';
    return;
  }

  const normalizedFrom = from.getTime() <= to.getTime() ? from : to;
  const normalizedTo = from.getTime() <= to.getTime() ? to : from;

  label.textContent = describeRange(normalizedFrom, normalizedTo, rawFrom, rawTo);
}

document.addEventListener('DOMContentLoaded', () => {
  initRequestId();
  initTimeRange();
});
