const essentialBuffs = [
  "ดาเมจกาย/เวทย์เพิ่มขึ้น",
  "ดาเมจต่อบอส",
  "ลดดาเมจ",
  "Critical Damage เพิ่มขึ้น",
  "Action speed เพิ่มขึ้น",
  "เร่งคูลดาวน์",
];

const essentialBuffs_EN = [
  "ATK/MAG Increase",
  "Boss Damage",
  "Damage Reduction",
  "Critical Damage Increase",
  "Action speed Increase",
  "Cooldown Acceleration",
];

const essentialDebuffs = [
  "เจาะกาย/เวทย์",
  "รับดาเมจกาย/เวทย์เพิ่มขึ้น",
  "รับ Critical Damage เพิ่มขึ้น",
  "ลดดาเมจ"
];

const essentialDebuffs_EN = [
  "Ignore Physical/Magical Defense",
  "Increase Damage Taken",
  "Increase Critical Damage Taken",
  "Damage Reduction"
];

const buffAliases = {
  "ลดดาเมจ": ["ลดดาเมจ", "def กาย/เวทย์เพิ่มขึ้น","ลดดาเมจจากบอส"],
  "เร่งคูลดาวน์": ["เร่งคูลดาวน์", "ลดคูลดาวน์", "reset skill CD","หั่นคูลดาวน์"],
  "Action speed เพิ่มขึ้น": ["Action speed เพิ่มขึ้น", "All Speed"],
  "วิ่ง/กระโดดเพิ่มขึ้น": ["วิ่ง/กระโดดเพิ่มขึ้น","วิ่งเร็วขึ้น", "All Speed"],
};

const debuffAliases = {
  "เจาะเวทย์/กาย": ["เจาะเวทย์", "เจาะกาย"],
  "รับดาเมจกาย/เวทย์เพิ่มขึ้น": ["รับดาเมจเพิ่มขึ้น"],
};

export const BUFF_DISPLAY_ORDER = [
  "All Stat",
  "ดาเมจกาย/เวทย์เพิ่มขึ้น",
  "ดาเมจต่อบอส",
  "ดาเมจเพิ่มขึ้น",
  "ดาเมจต่อมอนสเตอร์ที่ไม่ใช่บอสหรือมิดบอสเพิ่มขึ้น",
  "All Skill Damage",
  "All Damage",
  "Special Active Damage เพิ่มขึ้น",
  "Critical Damage เพิ่มขึ้น",
  "Strength and Bravery Skill Damage",
  "Critical",
  "Maximize",
  "ดาเมจเลือดต่ำ 10% (>50% HP)",
  "ดาเมจเลือดต่ำ 15% (>10% HP)",
  "ลดดาเมจ",
  "ลดดาเมจจากบอส",
  "def กาย/เวทย์เพิ่มขึ้น",
  "โล่ขาว",
  "MAX HP",
  "MAX HP เพิ่มขึ้น",
  "MAX MP",
  "เร่งคูลดาวน์",
  "เร่งHA&Master",
  "ลดคูลดาวน์",
  "หั่นคูลดาวน์",
  "reset skill CD",
  "All Speed",
  "Action speed เพิ่มขึ้น",
  "วิ่ง/กระโดดเพิ่มขึ้น",
  "วิ่งเร็วขึ้น",
  "วิ่งไวขึ้น",
  "เติมเกจ",
  "ตัวแดง",
  "SoT",
  "(เฉพาะคนผูก)",
  "คูลดาวน์ยาเร็วขึ้น",
  "ไซส์ตัวใหญ่ขึ้น",
  "ลดการใช้มานา",
  "เจนมานาไว",
];

export const DEBUFF_DISPLAY_ORDER = [
  "เจาะกาย/เวทย์",
  "รับดาเมจกาย/เวทย์เพิ่มขึ้น",
  "รับดาเมจเพิ่มขึ้น",
  "รับ Critical Damage เพิ่มขึ้น",
  "รับดาเมจกาย/เวทย์เพิ่มขึ้น (>50% HP)",
  "รับดาเมจกาย/เวทย์เพิ่มขึ้น (<50% HP)",
  "รับ Critical Damage เพิ่มขึ้น (>=76% HP)",
  "รับ Critical Damage เพิ่มขึ้น (51~75% HP)",
  "รับ Critical Damage เพิ่มขึ้น (<=50% HP)",
  "ลดดาเมจ",
  "ลดดาเมจเวทย์",
  "ลดธาตุ",
  "ลดความเร็ว",
];


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
  essentialBuffs,
  essentialBuffs_EN,
  essentialDebuffs,
  essentialDebuffs_EN,
};