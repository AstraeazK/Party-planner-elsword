const essentialBuffs = [
  "ดาเมจเวทย์/กายเพิ่มขึ้น",
  "ดาเมจต่อบอส",
  "ลดดาเมจ",
  "วิ่ง/กระโดดเพิ่มขึ้น",
  "Action speed เพิ่มขึ้น",
  "เร่งคูลดาวน์",
];

const essentialDebuffs = [
  "เจาะเวทย์/กาย",
  "รับดาเมจกาย/เวทย์เพิ่มขึ้น",
  "รับ Critical Damage เพิ่มขึ้น"
];

const buffAliases = {
  "ดาเมจเวทย์/กายเพิ่มขึ้น": ["ดาเมจเวทย์", "ดาเมจกาย"],
  "ลดดาเมจ": ["ลดดาเมจที่ได้รับ", "ลดดาเมจ", "def กาย/เวทย์เพิ่มขึ้น","ลดดาเมจจากบอส"],
  "เร่งคูลดาวน์": ["เร่งคูลดาวน์", "ลดคูลดาวน์", "reset skill CD"],
  "Action speed เพิ่มขึ้น": ["Action speed เพิ่มขึ้น", "All Speed"],
  "วิ่ง/กระโดดเพิ่มขึ้น": ["วิ่ง/กระโดดเพิ่มขึ้น","วิ่งเร็วขึ้น", "All Speed"],
};

const debuffAliases = {
  "เจาะเวทย์/กาย": ["เจาะเวทย์", "เจาะกาย"],
  "รับดาเมจกาย/เวทย์เพิ่มขึ้น": ["รับดาเมจกายเพิ่มขึ้น", "รับดาเมจเวทย์เพิ่มขึ้น", "รับดาเมจเพิ่มขึ้น"],
};

const UP_ICON = "assets/up-triangle.png";
const DOWN_ICON = "assets/down-triangle.png";

// ---------------- Missing Buffs ----------------
function calculateMissingBuffs(activeBuffs, activeDebuffs) {
  const normalize = str => str.toLowerCase().replace(/\s+/g, "").replace(/[0-9.%x×]/g,"");
  const includesAny = (text, keywords) => keywords.some(k => normalize(text).includes(normalize(k)));

  const missingBuffs = essentialBuffs.filter(essential => {
    const aliases = buffAliases[essential] || [essential];
    return !activeBuffs.some(({buff}) => includesAny(buff, aliases));
  });

  const missingDebuffs = essentialDebuffs.filter(essential => {
    const aliases = debuffAliases[essential] || [essential];
    return !activeDebuffs.some(({buff}) => includesAny(buff, aliases));
  });

  return { missingBuffs, missingDebuffs };
}

// ---------- utils ----------
export function normalizeKey(str) {
  return String(str || '')
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[0-9.%x×]/g, '');
}

export function extractNumber(name) {
  const m = String(name).match(/(\d+(?:\.\d+)?)(\s*[%x×])?/);
  if (!m) return '';
  return m[1] + (m[2] || '');
}

export function stripNumbersAndPercents(str) {
  return String(str || '')
    .replace(/(\d+(?:\.\d+)?\s*[%x×]?)/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// ---------- compare ----------
export function buildCompareMap(selList = [], tgtList = []) {
  const map = {};

  selList.forEach(b => {
    const key = normalizeKey(b.name);
    map[key] = map[key] || {};
    map[key].sel = b;
  });

  tgtList.forEach(b => {
    const key = normalizeKey(b.name);
    map[key] = map[key] || {};
    map[key].tgt = b;
  });

  return map;
}

export function compareValues(leftName, rightName) {
  const leftMatch = leftName?.match(/\d+(?:\.\d+)?/);
  const rightMatch = rightName?.match(/\d+(?:\.\d+)?/);

  if (!leftMatch || !rightMatch) {
    return { leftIcon: '', rightIcon: '' };
  }

  const left = parseFloat(leftMatch[0]);
  const right = parseFloat(rightMatch[0]);

  if (left === right) {
    return { leftIcon: '', rightIcon: '' };
  }

  if (left > right) {
    return { leftIcon: UP_ICON, rightIcon: DOWN_ICON };
  }

  return { leftIcon: DOWN_ICON, rightIcon: UP_ICON };
}



export { 
  calculateMissingBuffs, 
};