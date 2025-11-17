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
  // update duplicate warnings for all rows first
  updateDuplicateWarnings();

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

// ---------- Duplicate warning: แจ้งเตือนถ้ามีตัวละครซ้ำในแต่ละแถว ----------
function updateDuplicateWarnings() {
  const rows = document.querySelectorAll('.party-row');
  rows.forEach(row => {
    const imgs = Array.from(row.querySelectorAll('[data-slot] img'));
    const names = imgs.map(img => img.src.split('/').pop()).filter(Boolean);
    const counts = {};
    names.forEach(n => counts[n] = (counts[n] || 0) + 1);
    const hasDup = Object.values(counts).some(c => c > 1);

    let badge = row.querySelector('.duplicate-warning');
    if (hasDup) {
      if (!badge) {
        badge = document.createElement('div');
        // place badge after the last data-slot so it appears inline with slots
        badge.className = 'duplicate-warning ml-2 bg-yellow-400 text-black text-xs font-semibold px-2 py-0.5 rounded self-center whitespace-nowrap';
        badge.innerText = '⚠️มีตัวละครซ้ำกัน';
        const slots = row.querySelectorAll('[data-slot]');
        const lastSlot = slots[slots.length - 1];
        if (lastSlot && lastSlot.parentNode) {
          lastSlot.insertAdjacentElement('afterend', badge);
        } else {
          row.appendChild(badge);
        }
      }
    } else {
      if (badge) badge.remove();
    }
  });
}

// ---------- Merge helper: รวม Buff/ Debuff ที่เหมือนกัน และบวกค่าตัวเลข ----------
function mergeBuffsAndDebuffs(allBuffs, allDebuffs) {
  const merge = (list) => {
    const map = {};
    list.forEach(({ buff, charName }) => {
      const key = buff.toLowerCase().replace(/\s+/g, "").replace(/[0-9.%x×]/g, "");
      if (!map[key]) map[key] = { text: buff, entries: [], units: null, sources: new Set() };
      if (charName) map[key].sources.add(charName);

      // สกัดค่าตัวเลขและหน่วย พร้อมเก็บจำนวนจุดทศนิยม และข้อความดั้งเดิม
      const numMatch = buff.match(/(\d+(?:\.\d+)?)\s*(%|x|×)?/);
      const raw = numMatch ? numMatch[1] : null;
      const value = raw ? parseFloat(raw) : null;
      const decimals = raw && raw.includes('.') ? raw.split('.')[1].length : 0;
      if (numMatch && map[key].units === null) map[key].units = numMatch[2] || '';

      map[key].entries.push({ source: charName, text: buff, value, decimals });
    });

    return Object.values(map).map((v) => {
      let displayName = v.text;
      // ถ้ามีค่าตัวเลขหลายตัว ให้บวกกัน (และจัดรูปแบบเพื่อเลี่ยงปัญหา floating point)
      const numericEntries = v.entries.filter(e => typeof e.value === 'number');
      if (numericEntries.length > 1) {
        const sum = numericEntries.reduce((a, b) => a + b.value, 0);
        const maxDecimals = numericEntries.reduce((m, b) => Math.max(m, b.decimals || 0), 0);
        const precision = Math.min(Math.max(maxDecimals, 0), 6);
        const rounded = precision > 0 ? parseFloat(sum.toFixed(precision)) : Math.round(sum);
        const suffix = v.units || '';
        displayName = v.text.replace(/(\d+(?:\.\d+)?)\s*(%|x|×)?/, `${rounded}${suffix}`);
      }
      return { name: displayName, sources: Array.from(v.sources), entries: v.entries };
    });
  };

  return { mergedBuffs: merge(allBuffs), mergedDebuffs: merge(allDebuffs) };
}

// ---------- Render helper: แสดงรายการบนหน้า HTML ----------
function renderBuffLists(mergedBuffs, mergedDebuffs, missingBuffs) {
  const buffListEl = document.getElementById("buff-list");
  const debuffListEl = document.getElementById("debuff-list");
  const missingListEl = document.getElementById("missing-buff-list");

  if (buffListEl) {
    buffListEl.innerHTML = '';
    mergedBuffs.forEach(b => {
      const li = document.createElement('li');
      li.className = 'text-green-200 relative cursor-default';
      li.innerText = b.name;
      li.dataset.entries = encodeURIComponent(JSON.stringify(b.entries || []));

      li.addEventListener('mouseenter', (e) => {
        const entries = JSON.parse(decodeURIComponent(li.dataset.entries || '[]'));
        highlightSlotsForEntries(entries, true);
        showEntriesTooltip(li, entries);
      });
      li.addEventListener('mouseleave', () => {
        highlightSlotsForEntries([], false);
        removeEntriesTooltip();
      });

      buffListEl.appendChild(li);
    });
  }

  if (debuffListEl) {
    debuffListEl.innerHTML = '';
    mergedDebuffs.forEach(d => {
      const li = document.createElement('li');
      li.className = 'text-pink-200 relative cursor-default';
      li.innerText = d.name;
      li.dataset.entries = encodeURIComponent(JSON.stringify(d.entries || []));

      li.addEventListener('mouseenter', () => {
        const entries = JSON.parse(decodeURIComponent(li.dataset.entries || '[]'));
        highlightSlotsForEntries(entries, true);
        showEntriesTooltip(li, entries);
      });
      li.addEventListener('mouseleave', () => {
        highlightSlotsForEntries([], false);
        removeEntriesTooltip();
      });

      debuffListEl.appendChild(li);
    });
  }

  if (missingListEl) {
    missingListEl.innerHTML = '';
    if (!missingBuffs || missingBuffs.length === 0) {
      const li = document.createElement('li');
      li.className = 'text-yellow-300';
      li.innerText = 'ไม่มี Missing Buffs';
      missingListEl.appendChild(li);
    } else {
      missingListEl.innerHTML = missingBuffs.map(m => `<li class="text-yellow-300">${escapeHtml(m)}</li>`).join('');
    }
  }

  // ---------- Recommended Characters for Missing Buffs ----------
  const recommendListEl = document.getElementById('recommend-char-list');
  if (recommendListEl) {
    recommendListEl.innerHTML = '';
    if (!missingBuffs || missingBuffs.length === 0) return;
    // Find all characters not in selected row
    const selectedRow = document.querySelector('.party-row.party-selected');
    const partyCharNames = selectedRow ? Array.from(selectedRow.querySelectorAll('img')).map(img => {
      return Object.keys(charData).find(k => img.src.includes(k.replace('pics/', '')));
    }).filter(Boolean) : [];
    // For each missing buff, find characters that have it and are not in party
    const recommended = [];
    missingBuffs.forEach(missing => {
      const keyMissing = missing.toLowerCase().replace(/\s+/g, '').replace(/[0-9.%x×]/g, '');
      Object.entries(charData).forEach(([charKey, info]) => {
        if (partyCharNames.includes(charKey)) return;
        if (info.buffs.some(b => b.toLowerCase().replace(/\s+/g, '').replace(/[0-9.%x×]/g, '') === keyMissing)) {
          recommended.push({ charKey, buff: missing });
        }
      });
    });
    // Render recommended characters (unique only)
    const uniqueChars = Array.from(new Set(recommended.map(r => r.charKey)));
    uniqueChars.forEach(charKey => {
      const img = document.createElement('img');
      img.src = charKey;
      img.alt = charKey.split('/').pop();
      img.className = 'w-[48px] h-[48px] object-contain rounded border-2 border-pink-300 shadow hover:scale-110 transition-transform';
      img.title = charKey.split('/').pop().replace('Icon_-_', '').replace(/_/g, ' ');
      recommendListEl.appendChild(img);
    });
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

// ---------- Helpers for hover highlight + tooltip ----------
function prettifyFileName(filename) {
  if (!filename) return '';
  const name = filename.replace(/\.png$|\.jpg$|\.jpeg$/i, '').replace(/Icon_-_/i, '').replace(/_/g, ' ').trim();
  return name;
}

function highlightSlotsForEntries(entries, highlight, isGrayOutMode = false) {
  const filenames = entries.map(e => e.source ? e.source.split('/').pop() : null).filter(Boolean);
  const selectedRow = document.querySelector('.party-row.party-selected');
  if (!selectedRow) return;
  selectedRow.querySelectorAll('[data-slot]').forEach(slot => {
    const img = slot.querySelector('img');
    const label = slot.querySelector('.buff-label');
    if (!img) {
      slot.classList.remove('ring-4','ring-yellow-400','scale-105','transition-transform','opacity-40','grayscale');
      if (label) label.remove();
      return;
    }
    const imgName = img.src.split('/').pop();
    const matched = filenames.includes(imgName);
    
    if (highlight) {
      if (isGrayOutMode) {
        // Gray-out mode: gray ตัวที่ไม่มี, normal ตัวที่มี (ไม่ highlight)
        if (matched) {
          slot.classList.remove('ring-4','ring-yellow-400','scale-105','transition-transform','opacity-40','grayscale');
          if (label) label.remove();
        } else {
          slot.classList.remove('ring-4','ring-yellow-400','scale-105','transition-transform');
          slot.classList.add('opacity-40','grayscale');
          if (label) label.remove();
        }
      } else {
        // Normal highlight mode: highlight ตัวที่มี, gray ตัวที่ไม่มี
        if (matched) {
          slot.classList.add('ring-4','ring-yellow-400','scale-105','transition-transform');
          slot.classList.remove('opacity-40','grayscale');
          // find matching entry and show value
          const matchingEntry = entries.find(e => e.source && e.source.split('/').pop() === imgName);
          if (matchingEntry && matchingEntry.text) {
            const valMatch = matchingEntry.text.match(/(\d+(?:\.\d+)?)\s*(%|x|×)?/);
            if (valMatch && !label) {
              const newLabel = document.createElement('div');
              newLabel.className = 'buff-label absolute bottom-1 right-1 bg-gradient-to-b from-pink-400 to-pink-500 text-white text-sm font-extrabold px-2 py-1 rounded shadow-lg';
              newLabel.style.pointerEvents = 'none';
              newLabel.style.minWidth = '2rem';
              newLabel.style.textAlign = 'center';
              newLabel.innerText = valMatch[0];
              slot.classList.add('relative');
              slot.appendChild(newLabel);
            }
          }
        } else {
          slot.classList.remove('ring-4','ring-yellow-400','scale-105','transition-transform');
          slot.classList.add('opacity-40','grayscale');
          if (label) label.remove();
        }
      }
    } else {
      slot.classList.remove('ring-4','ring-yellow-400','scale-105','transition-transform','opacity-40','grayscale');
      if (label) label.remove();
    }
  });

  // Gray-out ตัวละครใน #char-container ถ้า isGrayOutMode
  const charContainer = document.getElementById('char-container');
  if (charContainer) {
    charContainer.querySelectorAll('img').forEach(img => {
      const imgName = img.src.split('/').pop();
      const matched = filenames.includes(imgName);
      if (highlight && isGrayOutMode) {
        if (matched) {
          img.classList.remove('opacity-40', 'grayscale');
        } else {
          img.classList.add('opacity-40', 'grayscale');
        }
      } else {
        img.classList.remove('opacity-40', 'grayscale');
      }
    });
  }
}

  let _buffEntriesTooltip = null;
function showEntriesTooltip(targetEl, entries) {
  removeEntriesTooltip();
  const tooltip = document.createElement('div');
  tooltip.id = 'buff-entries-tooltip';
  tooltip.className = 'z-50 bg-gray-800 border border-pink-500 p-2 rounded text-sm text-white shadow-lg';
  tooltip.style.position = 'fixed';
  tooltip.style.maxWidth = '320px';
  tooltip.style.wordBreak = 'break-word';
  tooltip.style.boxSizing = 'border-box';
  tooltip.style.padding = '8px';
  tooltip.style.pointerEvents = 'none';

  entries.forEach(e => {
    const line = document.createElement('div');
    const file = e.source ? e.source.split('/').pop() : e.source || '';
    const pretty = prettifyFileName(file);
    const text = e.text ? e.text : (e.value !== null ? String(e.value) : '');
    line.innerText = `${pretty}: ${text}`;
    line.style.marginBottom = '4px';
    tooltip.appendChild(line);
  });

  // hide until positioned to avoid flicker
  tooltip.style.visibility = 'hidden';
  document.body.appendChild(tooltip);
  _buffEntriesTooltip = tooltip;

  // position: try to the right of element; if it would overflow, place to the left; clamp vertically
  const rect = targetEl.getBoundingClientRect();
  const ttRect = tooltip.getBoundingClientRect();
  const margin = 8;

  // compute preferred left (right side)
  let left = rect.right + margin;
  const rightLimit = window.innerWidth - margin;
  if (left + ttRect.width > rightLimit) {
    // try left side
    left = rect.left - ttRect.width - margin;
    if (left < margin) {
      // clamp inside viewport
      left = Math.max(margin, rightLimit - ttRect.width);
    }
  }

  let top = rect.top;
  const bottomLimit = window.innerHeight - margin;
  if (top + ttRect.height > bottomLimit) top = bottomLimit - ttRect.height;
  if (top < margin) top = margin;

  tooltip.style.left = `${left}px`;
  tooltip.style.top = `${top}px`;
  tooltip.style.visibility = 'visible';
}

function removeEntriesTooltip() {
  if (_buffEntriesTooltip) {
    _buffEntriesTooltip.remove();
    _buffEntriesTooltip = null;
  }
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

  // Allow clicking a party row anywhere to select it
  partyRows.forEach((row, index) => {
    row.addEventListener('click', (e) => {
      // if click originated from controls inside buff-section or other interactive elements, ignore
      if (e.target.closest('#buff-section')) return;
      setRowSelected(row);
      activeRowIndex = index;
      updateBuffsForRow(index);
      e.stopPropagation();
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
    activeRowIndex = null;
  }
});


});
