import { calculateMissingBuffs } from "./buffDebuff.js";
import { charData } from "./charData.js";
import { pics } from "./pics.js";
let activeRowIndex = null; // แถวที่เลือกอยู่

document.addEventListener("DOMContentLoaded", () => {
  const charContainer = document.getElementById("char-container");
  const partyRows = document.querySelectorAll(".party-row");

  // ---------- สร้าง <img> ตัวละคร ----------
  function createCharImage(src) {
    const img = document.createElement("img");
    img.src = src;
    img.alt = src.split("/").pop();
    img.className = "w-[65px] h-[65px] object-contain bg-gray-700 cursor-pointer";
    img.draggable = true;
    img.addEventListener("dragstart", (e) => {
      e.dataTransfer.setData("text/plain", src);
      e.dataTransfer.effectAllowed = "copy";
    });
    return img;
  }

  pics.forEach((src) => charContainer.appendChild(createCharImage(src)));
  // ---------- คลิกขวาใส่ char ใน slot ว่างของแถวที่เลือก ----------
  charContainer.addEventListener("contextmenu", (e) => {
    e.preventDefault();

    const imgEl = e.target.closest("img");
    if (!imgEl) return;

    if (activeRowIndex === null) return;
    const selectedRow = partyRows[activeRowIndex];
    const emptySlot = [...selectedRow.querySelectorAll("[data-slot]")]
      .find(slot => slot.children.length === 0);

    if (!emptySlot) return;

    const src = imgEl.src;
    const newImg = document.createElement("img");
    newImg.src = src;
    newImg.className = "w-full h-full object-contain";
    newImg.draggable = true;

    // 🔹 เพิ่ม dragstart สำหรับลากกลับ
    newImg.addEventListener("dragstart", (e) => {
      e.dataTransfer.setData("text/plain", src);
      e.dataTransfer.setData("fromRowIndex", activeRowIndex.toString());
      e.dataTransfer.effectAllowed = "move";
    });

    // 🔹 คลิกขวาเพื่อลบตัวละคร
    newImg.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      newImg.remove();
      updateBuffs();
    });

    emptySlot.appendChild(newImg);
    updateBuffs();
  });

  // ---------- ป้องกันลากไฟล์เข้า text ----------
  document.querySelectorAll("#custom-text-slot").forEach((slot) => {
    ["dragenter", "dragover", "drop"].forEach((event) => {
      slot.addEventListener(event, (e) => {
        if (e.dataTransfer?.files?.length) e.preventDefault();
      });
    });
    const maxLength = 22;
    slot.addEventListener("input", () => {
      if (slot.innerText.length > maxLength) slot.innerText = slot.innerText.slice(0, maxLength);
    });
  });

  // ---------- Drag & Drop ----------
  partyRows.forEach((row, rowIndex) => {
    const slots = row.querySelectorAll("[data-slot]");
    const clearBtn = row.querySelector(".cursor-pointer");

    if (clearBtn) clearBtn.addEventListener("click", () => {
      slots.forEach((s) => (s.innerHTML = ""));
      const buffList = document.getElementById("buff-list");
      const debuffList = document.getElementById("debuff-list");
      const missingBuffList = document.getElementById("missing-buff-list");

      if (buffList) buffList.innerHTML = "";
      if (debuffList) debuffList.innerHTML = "";
      if (missingBuffList) missingBuffList.innerHTML = "";

      updateBuffs();
    });


    slots.forEach((slot) => {
      slot.addEventListener("dragover", (e) => {
        e.preventDefault();
      });

      slot.addEventListener("dragleave", () => {
        slot.classList.remove("animate-pulse-glow");
      });

      slot.addEventListener("drop", (e) => {
        e.preventDefault();
        slot.classList.remove("animate-pulse-glow");
        const src = e.dataTransfer.getData("text/plain");
        if (!src) return;

        slot.innerHTML = "";
        const imgEl = document.createElement("img");
        imgEl.src = src;
        imgEl.className = "w-full h-full object-contain";
        imgEl.draggable = true;
        imgEl.addEventListener("dragstart", (e) => {
          e.dataTransfer.setData("text/plain", src);
          e.dataTransfer.setData("fromRowIndex", rowIndex.toString());
          e.dataTransfer.effectAllowed = "move";
        });

        imgEl.addEventListener("contextmenu", (e) => {
          e.preventDefault();
          imgEl.remove();
          updateBuffs();
        });

        slot.appendChild(imgEl);

        if (!document.querySelector(".party-row.party-selected")) {
          setRowSelected(partyRows[rowIndex]);
        }

        updateBuffs();
      });

    });
  });

  // ---------- Drop กลับลงล่าง ----------
  charContainer.addEventListener("dragover", (e) => e.preventDefault());
  charContainer.addEventListener("drop", (e) => {
  e.preventDefault();
  const src = e.dataTransfer.getData("text/plain");
  const fromRowIndex = e.dataTransfer.getData("fromRowIndex");
  if (!src) return;

  if (fromRowIndex !== "" && fromRowIndex !== null) {
    const row = partyRows[fromRowIndex];
    if (row) {
      row.querySelectorAll("[data-slot] img").forEach((img) => {
        if (img.src.endsWith(src.split("/").pop())) img.remove();
      });
    }
  }

  updateBuffs();
});


function updateBuffs() {
  const selectedRow = document.querySelector(".party-row.party-selected");
  if (!selectedRow) return;

  const imgs = selectedRow.querySelectorAll("img");
  if (imgs.length === 0) {
    ["buff-list", "debuff-list", "missing-buff-list"].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.innerHTML = "";
    });
    return;
  }

  const allBuffs = [];
  const allDebuffs = [];

  imgs.forEach(img => {
    const srcKey = Object.keys(charData).find(k => img.src.includes(k.replace("pics/", "")));
    const info = srcKey ? charData[srcKey] : null;
    if (info) {
      info.buffs.forEach(b => allBuffs.push({ buff: b, charName: srcKey }));
      info.debuffs.forEach(d => allDebuffs.push({ buff: d, charName: srcKey }));
    }
  });

  const { mergedBuffs, mergedDebuffs } = mergeBuffsAndDebuffs(allBuffs, allDebuffs);
  const { missingBuffs } = calculateMissingBuffs(allBuffs, allDebuffs);

  renderBuffLists(mergedBuffs, mergedDebuffs, missingBuffs);
}

// ---------- Merge helper: รวม Buff/ Debuff ที่เหมือนกัน และบวกค่าตัวเลข ----------
function mergeBuffsAndDebuffs(allBuffs, allDebuffs) {
  const merge = (list) => {
    const map = {};
    list.forEach(({ buff, charName }) => {
      const key = buff.toLowerCase().replace(/\s+/g, "").replace(/[0-9.%x×]/g, "");
      if (!map[key]) map[key] = { text: buff, values: [], units: null, sources: new Set() };
      if (charName) map[key].sources.add(charName);
      
      // สกัดค่าตัวเลขและหน่วย (เช่น "20%" → {value: 20, unit: "%"}, "ลดธาตุ 150" → {value: 150, unit: ""})
      const numMatch = buff.match(/(\d+(?:\.\d+)?)\s*(%|x|×)?/);
      if (numMatch) {
        map[key].values.push(parseFloat(numMatch[1]));
        // เก็บหน่วยจากครั้งแรก (ถือว่า buff เดียวกันมีหน่วยเดียวกัน)
        if (map[key].units === null) {
          map[key].units = numMatch[2] || '';
        }
      }
    });
    
    return Object.values(map).map((v) => {
      let displayName = v.text;
      // ถ้ามีค่าตัวเลขหลายตัว ให้บวกกัน
      if (v.values.length > 1) {
        const sum = v.values.reduce((a, b) => a + b, 0);
        const suffix = v.units || '';
        displayName = v.text.replace(/(\d+(?:\.\d+)?)\s*(%|x|×)?/, sum + suffix);
      }
      return { name: displayName, sources: Array.from(v.sources) };
    });
  };

  return { mergedBuffs: merge(allBuffs), mergedDebuffs: merge(allDebuffs) };
}

// ---------- Render helper: แสดงรายการบนหน้า HTML ----------
function renderBuffLists(mergedBuffs, mergedDebuffs, missingBuffs) {
  const buffListEl = document.getElementById("buff-list");
  const debuffListEl = document.getElementById("debuff-list");
  const missingListEl = document.getElementById("missing-buff-list");

  if (buffListEl) buffListEl.innerHTML = mergedBuffs.map(b => {
    return `<li class="text-green-200">${escapeHtml(b.name)}</li>`;
  }).join('');

  if (debuffListEl) debuffListEl.innerHTML = mergedDebuffs.map(d => {
    return `<li class="text-pink-200">${escapeHtml(d.name)}</li>`;
  }).join('');

  if (missingListEl) {
    if (!missingBuffs || missingBuffs.length === 0) {
      missingListEl.innerHTML = `<li class="text-yellow-300">ไม่มี Missing Buffs</li>`;
    } else {
      missingListEl.innerHTML = missingBuffs.map(m => `<li class="text-yellow-300">${escapeHtml(m)}</li>`).join('');
    }
  }
}

// ---------- Utility: ป้องกัน XSS เบื้องต้น ----------
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ---------- Buff ของแถวเดียว ----------
function updateBuffsForRow(rowIndex) {
  const row = partyRows[rowIndex];
  const imgs = row.querySelectorAll("img");

  const buffList = [];
  const debuffList = [];

  imgs.forEach((img) => {
    const srcKey = Object.keys(charData).find(k => img.src.includes(k.replace("pics/", "")));
    const info = srcKey ? charData[srcKey] : null;
    if (info) {
      // ส่งทั้ง buff/debuff พร้อม charName
      info.buffs.forEach(b => buffList.push({ buff: b, charName: srcKey }));
      info.debuffs.forEach(d => debuffList.push({ buff: d, charName: srcKey }));
    }
  });

  updateBuffs();
}

  // ---------- Highlight ----------
  const scrollButtons = document.querySelectorAll(".scroll-btn, [data-lucide='scroll-text']");

  function setRowSelected(row) {
    document.querySelectorAll(".party-row.party-selected").forEach((r) =>
      r.classList.remove("party-selected", "ring-4", "ring-pink-500")
    );
    row.classList.add("party-selected", "ring-4", "ring-pink-500");
  }

  function clearRowSelection() {
    document.querySelectorAll(".party-row.party-selected").forEach((r) =>
      r.classList.remove("party-selected", "ring-4", "ring-pink-500")
    );
  }

  scrollButtons.forEach((btn) => {
    const row = btn.closest(".party-row");
    const index = [...partyRows].indexOf(row);
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      setRowSelected(row);
      activeRowIndex = index;
      updateBuffsForRow(index);
    });
  });

  document.addEventListener("click", (e) => {
  const isInsidePartyRow = e.target.closest(".party-row");
  const isInsideBuffSection = e.composedPath().some(
    (el) => el.id === "buff-section"
  );

  if (!isInsidePartyRow && !isInsideBuffSection) {
    clearRowSelection();
    ["buff-list", "debuff-list", "missing-buff-list"].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.innerHTML = "";
    });
  }
});


});
