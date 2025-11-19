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

export { 
  calculateMissingBuffs, 
};