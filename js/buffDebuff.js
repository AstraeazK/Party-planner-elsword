const essentialBuffs = [
  "ดาเมจกาย/เวทย์เพิ่มขึ้น",
  "ดาเมจต่อบอส",
  "ลดดาเมจ",
  "Critical Damage เพิ่มขึ้น",
  "Action Speed เพิ่มขึ้น",
  "เร่งคูลดาวน์",
  "All Skill Damage",
];

const essentialBuffs_EN = [
  "Physical/Magical Attack",
  "Boss Damage",
  "Damage Reduction",
  "Critical Damage Increase",
  "Action Speed",
  "Cooldown Acceleration",
  "All Skill Damage",
];

const essentialDebuffs = [
  "เจาะกาย/เวทย์",
  "รับดาเมจกาย/เวทย์เพิ่มขึ้น",
  "รับ Critical Damage เพิ่มขึ้น",
  "ดาเมจจากมอนลดลง",
];

const essentialDebuffs_EN = [
  "Ignore Physical/Magical Defense",
  "Damage Taken",
  "Critical Damage Taken",
  "Damage Reduction from Monsters",
];

const buffAliases = {
  "ดาเมจกาย/เวทย์เพิ่มขึ้น": ["ดาเมจกาย/เวทย์เพิ่มขึ้น", "Physical/Magical Attack"],
  "ดาเมจต่อบอส": ["ดาเมจต่อบอส", "Boss Damage"],
  "ลดดาเมจ": ["ลดดาเมจ", "def กาย/เวทย์เพิ่มขึ้น", "ลดดาเมจจากบอส", "Damage Reduction", "def phy/mag increase","Boss Damage Reduction"],
  "Critical Damage เพิ่มขึ้น": ["Critical Damage เพิ่มขึ้น", "Critical Damage"],
  "Action Speed เพิ่มขึ้น": ["Action Speed เพิ่มขึ้น", "Action Speed", "All Speed"],
  "เร่งคูลดาวน์": ["เร่งคูลดาวน์", "Reset Skill Cooldown", "Cooldown Acceleration"],
  "วิ่ง/กระโดดเพิ่มขึ้น": ["วิ่ง/กระโดดเพิ่มขึ้น", "วิ่งเร็วขึ้น", "All Speed"],
};

const debuffAliases = {
  "เจาะกาย/เวทย์": ["เจาะกาย/เวทย์", "Ignore Physical/Magical Defense"],
  "รับดาเมจกาย/เวทย์เพิ่มขึ้น": [ "รับดาเมจกาย/เวทย์เพิ่มขึ้น", "รับดาเมจเพิ่มขึ้น", "Damage Taken","รับดาเมจกาย/เวทย์เพิ่มขึ้น (>50% HP)",
                            "รับดาเมจกาย/เวทย์เพิ่มขึ้น (<50% HP)","Damage Taken 10% (>50% HP)","Damage Taken 15% (>10% HP)"],
  "รับ Critical Damage เพิ่มขึ้น": ["รับ Critical Damage เพิ่มขึ้น", "Critical Damage Taken"],
  "ดาเมจจากมอนลดลง": ["ดาเมจจากมอนลดลง", "Damage Reduction from Monsters"],
};

export const BUFF_DISPLAY_ORDER = [
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
  "บล็อกดาเมจ",
  "โล่ขาว",
  "MAX HP",
  "MAX MP",
  "เร่งคูลดาวน์",
  "เร่งHA&Master",
  "Reset Skill Cooldown",
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

export const BUFF_DISPLAY_ORDER_EN = [
  "Physical/Magical Attack",
  "Boss Damage",
  "Damage",
  "Damage to NonBoss/MidBoss Monsters",
  "All Skill Damage",
  "All Damage",
  "Special Active Skill Damage",
  "Critical Damage",
  "Strength & Bravery Skill Damage",
  "Critical",
  "Maximize",
  "Low HP Damage 10% (>50% HP)",
  "Low HP Damage 15% (>10% HP)",
  "Damage Reduction",
  "Boss Damage Reduction",
  "def phy/mag increase",
  "Block Damage",
  "Shield",
  "MAX HP",
  "MAX MP",
  "Cooldown Acceleration",
  "HA & Master Skill Cooldown",
  "Reset Skill Cooldown",
  "All Speed",
  "Action Speed",
  "Movement/Jump Speed",
  "Movement Speed",
  "Movement Speed 1.3x",
  "Special Resource",
  "Super Armor",
  "SoT",
  "(Vow)",
  "Potion Cooldown Faster",
  "Character Size",
  "Mana Cost",
  "MP Gain",
];

export const DEBUFF_DISPLAY_ORDER = [
  "เจาะกาย/เวทย์",
  "รับดาเมจกาย/เวทย์เพิ่มขึ้น",
  "รับดาเมจกาย/เวทย์เพิ่มขึ้น (>50% HP)",
  "รับดาเมจกาย/เวทย์เพิ่มขึ้น (<50% HP)",
  "รับ Critical Damage เพิ่มขึ้น",
  "รับ Critical Damage เพิ่มขึ้น (>=76% HP)",
  "รับ Critical Damage เพิ่มขึ้น (51~75% HP)",
  "รับ Critical Damage เพิ่มขึ้น (<=50% HP)",
  "ดาเมจจากมอนลดลง",
  "ลดธาตุ",
  "ลดความเร็ว",
];

export const DEBUFF_DISPLAY_ORDER_EN = [
  "Ignore Physical/Magical Defense",
  "Damage Taken",
  "Damage Taken (>50% HP)",
  "Damage Taken (<50% HP)",
  "Critical Damage Taken",
  "Critical Damage Taken (>=76% HP)",
  "Critical Damage Taken (51~75% HP)",
  "Critical Damage Taken (<=50% HP)",
  "Damage Reduction from Monsters",
  "Elemental Resistance",
  "Speed",
];

const UP_ICON = "assets/up-triangle.png";
const DOWN_ICON = "assets/down-triangle.png";

// ---------------- Missing Buffs ----------------
function calculateMissingBuffs(activeBuffs, activeDebuffs) {
  const normalize = str => String(str || '')
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[0-9.%x×]/g, "")
    .replace(/[^a-zก-๙]/g, "");
  const matchesAny = (text, keywords) => keywords.some(k => normalize(text) === normalize(k));

  const missingBuffs = essentialBuffs.filter(essential => {
    const aliases = buffAliases[essential] || [essential];
    return !activeBuffs.some(({buff}) => matchesAny(buff, aliases));
  });

  const missingDebuffs = essentialDebuffs.filter(essential => {
    const aliases = debuffAliases[essential] || [essential];
    return !activeDebuffs.some(({buff}) => matchesAny(buff, aliases));
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