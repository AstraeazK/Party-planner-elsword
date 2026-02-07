let currentCompareType = 'buff';
let _buffMap = {};
let _debuffMap = {};
import {
  stripNumbersAndPercents,
  compareValues,
  extractNumber,
  BUFF_DISPLAY_ORDER,
  DEBUFF_DISPLAY_ORDER,
  normalizeKey
} from './buffDebuff.js';

export function initCompareTable({ buffMap, debuffMap }) {
  _buffMap = buffMap;
  _debuffMap = debuffMap;
  currentCompareType = 'buff';

  bindCompareSegment();
  renderCompareTable();
}

function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function renderCompareTable() {
  const tbody = document.querySelector('#compare-table tbody');
  if (!tbody) return;

  const map =
    currentCompareType === 'buff'
      ? _buffMap
      : _debuffMap;

  tbody.innerHTML = buildCompareRows(map);
}

function buildCompareRows(map) {
  let html = '';

  const displayOrder = currentCompareType === 'buff' ? BUFF_DISPLAY_ORDER : DEBUFF_DISPLAY_ORDER;
  const orderMap = {};
  displayOrder.forEach((name, index) => {
    orderMap[normalizeKey(name)] = index;
  });

  const ordered = [];
  const unordered = [];

  Object.keys(map).forEach(k => {
    const displayName = stripNumbersAndPercents(map[k].sel?.name || map[k].tgt?.name || '');
    const key = normalizeKey(displayName);
    if (key in orderMap) {
      ordered.push({ k, order: orderMap[key] });
    } else {
      unordered.push(k);
    }
  });

  ordered.sort((a, b) => a.order - b.order);
  const sortedKeys = ordered.map(x => x.k).concat(unordered);

  sortedKeys.forEach(k => {
    const row = map[k];
    const selName = row.sel?.name || '';
    const tgtName = row.tgt?.name || '';

    const displayName = stripNumbersAndPercents(selName || tgtName);

    const leftVal = row.sel
      ? escapeHtml(extractNumber(selName) || '✔️')
      : '❌';

    const rightVal = row.tgt
      ? escapeHtml(extractNumber(tgtName) || '✔️')
      : '❌';

    const { leftIcon, rightIcon } = compareValues(selName, tgtName);

    html += `
      <tr>
        <td style="padding:6px; text-align:center;">${leftVal}</td>
        <td style="padding:6px; text-align:center;">
          ${leftIcon ? `<img src="${leftIcon}" style="width:14px;">` : ''}
        </td>
        <td style="padding:6px; text-align:center;">
          ${escapeHtml(displayName)}
        </td>
        <td style="padding:6px; text-align:center;">
          ${rightIcon ? `<img src="${rightIcon}" style="width:14px;">` : ''}
        </td>
        <td style="padding:6px; text-align:center;">${rightVal}</td>
      </tr>
    `;
  });

  if (!html) {
    html = `
      <tr>
        <td colspan="5" style="text-align:center; opacity:.5; padding:12px;">
          ไม่มีข้อมูล
        </td>
      </tr>
    `;
  }

  return html;
}

function bindCompareSegment() {
  document.querySelectorAll('.compare-segment button').forEach(btn => {
    btn.onclick = () => {
      currentCompareType = btn.dataset.type;

      document.querySelectorAll('.compare-segment button')
        .forEach(b => b.classList.remove('active'));

      btn.classList.add('active');
      renderCompareTable();
    };
  });
}
