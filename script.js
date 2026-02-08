import { calculateMissingBuffs, BUFF_DISPLAY_ORDER, DEBUFF_DISPLAY_ORDER, normalizeKey } from "./buffDebuff.js";
import { charData } from "./charData.js";
import { pics } from "./pics.js";
import { buildCompareMap } from './buffDebuff.js';
import { initCompareTable } from './compareTable.js';

let activeRowIndex = null;
let partyRows = null;

function setupDragStart(imgEl, src, rowElement) {
  imgEl.draggable = true;
  imgEl.addEventListener("dragstart", (e) => {
    e.dataTransfer.setData("text/plain", src);
    const rowSlots = Array.from(rowElement.querySelectorAll('[data-slot]'));
    const slotIndex = rowSlots.findIndex(slot => slot.contains(imgEl));
    const rowIndex = Array.from(partyRows).indexOf(rowElement);
    e.dataTransfer.setData("fromRowIndex", rowIndex.toString());
    e.dataTransfer.setData("fromSlotIndex", slotIndex.toString());
    e.dataTransfer.effectAllowed = "move";
  });
}

document.addEventListener("DOMContentLoaded", () => {
   const hint = document.getElementById("help-hint");
  const text = document.getElementById("help-hint-text");

  // 1. Fade-in + ยืดกล่อง
  setTimeout(() => {
    hint.classList.add("animate-expand");
  }, 400);

  // 2. ข้อความโผล่หลังยืดเสร็จ
  setTimeout(() => {
    text.style.animation = "fadeIn 0.3s forwards";
  }, 800);

  // 3. ค้างไว้แป๊บนึง
  setTimeout(() => {
    text.style.animation = "fadeOut 0.3s forwards";
  }, 2400);

  // 4. หดกล่องกลับ
  setTimeout(() => {
    hint.classList.remove("animate-expand");
    hint.classList.add("animate-collapse");
  }, 2700);

  const charContainer = document.getElementById("char-container");
  partyRows = document.querySelectorAll(".party-row");

  // ---------- สร้าง <img> ตัวละคร ----------
  function createCharImage(src) {
    const img = document.createElement("img");
    img.src = src;
    img.alt = src.split("/").pop();

    img.className = "w-[65px] h-[65px] object-contain bg-gray-700 cursor-pointer";
    img.draggable = true;
    if (charData[src]) {
      img.dataset.role = charData[src].role;
    }

    img.addEventListener("dragstart", (e) => {
      e.dataTransfer.setData("text/plain", src);
      e.dataTransfer.effectAllowed = "copy";
    });

    return img;
  }


  pics.forEach((src) => charContainer.appendChild(createCharImage(src)));
  // ---------- FILTER BUTTONS ----------
  const filterBtns = document.querySelectorAll("#char-filter-buttons .filter-btn");

  filterBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      const role = btn.dataset.role;
      filterCharacters(role);
      filterBtns.forEach(b => {
        b.classList.remove("bg-pink-600");
        b.classList.add("bg-gray-700");
      });
      btn.classList.add("bg-pink-600");
    });
  });

  function filterCharacters(role) {
    const chars = document.querySelectorAll("#char-container img");

    chars.forEach(img => {
      const imgRole = img.dataset.role;

      if (role === "all" || imgRole === role) {
        img.classList.remove("hidden");
      } else {
        img.classList.add("hidden");
      }
    });
  }


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

    setupDragStart(newImg, src, selectedRow);

    // คลิกขวาลบตัวละคร
    newImg.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      newImg.remove();
      updateBuffs();
    });

    emptySlot.appendChild(newImg);
    updateBuffs();
  });

  // ---------- กันลากไฟล์เข้า text ----------
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

  // ---------- ลากเข้าช่อง ----------
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

        const fromRowIndexStr = e.dataTransfer.getData('fromRowIndex');
        const fromSlotIndexStr = e.dataTransfer.getData('fromSlotIndex');
        const fromRowIndexVal = fromRowIndexStr !== "" && fromRowIndexStr !== null ? parseInt(fromRowIndexStr, 10) : null;
        const fromSlotIndexVal = fromSlotIndexStr !== "" && fromSlotIndexStr !== null ? parseInt(fromSlotIndexStr, 10) : null;

        const targetRowIndex = rowIndex;
        const targetRow = partyRows[targetRowIndex];
        const targetSlots = targetRow.querySelectorAll('[data-slot]');
        const targetImg = slot.querySelector('img');

        // If drag originated from a party row (move/swap)
        if (fromRowIndexVal !== null && !isNaN(fromRowIndexVal) && partyRows[fromRowIndexVal]) {
          const sourceRow = partyRows[fromRowIndexVal];
          const sourceSlots = sourceRow.querySelectorAll('[data-slot]');
          let sourceSlot = null;
          
          if (!isNaN(fromSlotIndexVal) && sourceSlots[fromSlotIndexVal]) {
            sourceSlot = sourceSlots[fromSlotIndexVal];
          }

          if (!sourceSlot || sourceSlot === slot && fromRowIndexVal === targetRowIndex) {
            return;
          }

          const sourceImg = sourceSlot ? sourceSlot.querySelector('img') : null;
          if (!sourceImg) {
            return;
          }

          sourceSlot.removeChild(sourceImg);
          
          if (fromRowIndexVal === targetRowIndex) {
            if (targetImg) {
              slot.removeChild(targetImg);
              slot.appendChild(sourceImg);
              sourceSlot.appendChild(targetImg);
              
              setupDragStart(sourceImg, sourceImg.src, targetRow);
              setupDragStart(targetImg, targetImg.src, targetRow);
            } else {
              slot.appendChild(sourceImg);
              setupDragStart(sourceImg, sourceImg.src, targetRow);
            }
          } else {
            if (targetImg) {
              slot.removeChild(targetImg);
            }
            slot.appendChild(sourceImg);
            setupDragStart(sourceImg, sourceImg.src, targetRow);
          }

          if (!document.querySelector('.party-row.party-selected')) {
            setRowSelected(targetRow);
          }
          updateBuffs();
          return;
        }
        slot.innerHTML = '';
        const imgEl = document.createElement('img');
        imgEl.src = src;
        imgEl.className = 'w-full h-full object-contain';

        setupDragStart(imgEl, src, targetRow);

        imgEl.addEventListener('contextmenu', (ev) => {
          ev.preventDefault();
          imgEl.remove();
          updateBuffs();
        });

        slot.appendChild(imgEl);
        if (!document.querySelector('.party-row.party-selected')) {
          setRowSelected(targetRow);
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
  updateDuplicateWarnings();
  let selectedRow = document.querySelector(".party-row.party-selected");
  if (!selectedRow && typeof activeRowIndex === 'number' && activeRowIndex !== null) {
    const rows = document.querySelectorAll('.party-row');
    selectedRow = rows[activeRowIndex] || null;
    if (selectedRow && !selectedRow.classList.contains('party-selected')) {
      selectedRow.classList.add('party-selected', 'ring-4', 'ring-pink-500');
    }
  }
  if (!selectedRow) {
    ["buff-list", "debuff-list", "missing-buff-list"].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.innerHTML = "";
    });
    const recommendEl = document.getElementById('recommend-char-list');
    if (recommendEl) recommendEl.innerHTML = '';
    return;
  }

  const imgs = selectedRow.querySelectorAll("img");
  if (imgs.length === 0) {
    ["buff-list", "debuff-list", "missing-buff-list"].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.innerHTML = "";
    });
    const recommendEl = document.getElementById('recommend-char-list');
    if (recommendEl) recommendEl.innerHTML = '';
    return;
  }

  const allBuffs = [];
  const allDebuffs = [];

  const uniqueCharSources = new Set();
  imgs.forEach(img => {
    const srcKey = Object.keys(charData).find(k => img.src.includes(k.replace("pics/", "")));
    if (srcKey) {
      uniqueCharSources.add(srcKey);
    }
  });

  uniqueCharSources.forEach(srcKey => {
    const info = charData[srcKey];
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

// ---------- รวมบัพ ----------
function mergeBuffsAndDebuffs(allBuffs, allDebuffs) {
  const merge = (list) => {
    const map = {};
    list.forEach(({ buff, charName }) => {
      const key = buff.toLowerCase().replace(/\s+/g, "").replace(/[0-9.%x×]/g, "");
      if (!map[key]) map[key] = { text: buff, entries: [], units: null, sources: new Set() };
      if (charName) map[key].sources.add(charName);

      const numMatch = buff.match(/(\d+(?:\.\d+)?)\s*(%|x|×)?/);
      const raw = numMatch ? numMatch[1] : null;
      const value = raw ? parseFloat(raw) : null;
      const decimals = raw && raw.includes('.') ? raw.split('.')[1].length : 0;
      if (numMatch && map[key].units === null) map[key].units = numMatch[2] || '';

      map[key].entries.push({ source: charName, text: buff, value, decimals });
    });

    return Object.values(map).map((v) => {
      let displayName = v.text;
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

// ---------- แสดงบัพด้านขวา ----------
function renderBuffLists(mergedBuffs, mergedDebuffs, missingBuffs) {
  const buffListEl = document.getElementById("buff-list");
  const debuffListEl = document.getElementById("debuff-list");
  const missingListEl = document.getElementById("missing-buff-list");

  // ฟังก์ชันเรียงลำดับตามลำดับที่กำหนด
  const sortByDisplayOrder = (items, displayOrder) => {
    const orderMap = {};
    displayOrder.forEach((name, index) => {
      orderMap[normalizeKey(name)] = index;
    });

    const ordered = [];
    const unordered = [];

    items.forEach(item => {
      const key = normalizeKey(item.name);
      if (key in orderMap) {
        ordered.push({ item, order: orderMap[key] });
      } else {
        unordered.push(item);
      }
    });

    ordered.sort((a, b) => a.order - b.order);
    return ordered.map(x => x.item).concat(unordered);
  };

  if (buffListEl) {
    buffListEl.innerHTML = '';
    const sortedBuffs = sortByDisplayOrder(mergedBuffs, BUFF_DISPLAY_ORDER);
    sortedBuffs.forEach(b => {
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
    const sortedDebuffs = sortByDisplayOrder(mergedDebuffs, DEBUFF_DISPLAY_ORDER);
    sortedDebuffs.forEach(d => {
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

  // ---------- แนะนำตัวละคร ----------
  const recommendListEl = document.getElementById('recommend-char-list');
  if (recommendListEl) {
    recommendListEl.innerHTML = '';
    if (!missingBuffs || missingBuffs.length === 0) return;
    const selectedRow = document.querySelector('.party-row.party-selected');
    const partyCharNames = selectedRow ? Array.from(selectedRow.querySelectorAll('img')).map(img => {
      return Object.keys(charData).find(k => img.src.includes(k.replace('pics/', '')));
    }).filter(Boolean) : [];
    const rolesInRow = new Set();
    if (selectedRow) {
      Array.from(selectedRow.querySelectorAll('img')).forEach(img => {
        const k = Object.keys(charData).find(k => img.src.includes(k.replace('pics/', '')));
        if (k && charData[k] && charData[k].role) rolesInRow.add(charData[k].role);
      });
    }

    let allowedRoles = null;
    if (rolesInRow.has('physical')) {
      allowedRoles = new Set(['physical', 'support']);
    } else if (rolesInRow.has('magic')) {
      allowedRoles = new Set(['magic', 'support']);
    }

    const recommended = [];
    missingBuffs.forEach(missing => {
      const keyMissing = missing.toLowerCase().replace(/\s+/g, '').replace(/[0-9.%x×]/g, '');
      Object.entries(charData).forEach(([charKey, info]) => {
        if (partyCharNames.includes(charKey)) return;
        if (allowedRoles && (!info.role || !allowedRoles.has(info.role))) return;
        if ((info.buffs || []).some(b => b.toLowerCase().replace(/\s+/g, '').replace(/[0-9.%x×]/g, '') === keyMissing)) {
          recommended.push({ charKey, buff: missing });
        }
      });
    });

    const uniqueChars = Array.from(new Set(recommended.map(r => r.charKey)));
    uniqueChars.forEach(charKey => {
      const img = document.createElement('img');
      img.src = charKey;
      img.alt = charKey.split('/').pop();
      img.className = 'w-[48px] h-[48px] object-contain rounded border-2 border-pink-300 shadow hover:scale-110 transition-transform';
      const displayName = charKey
        .split('/').pop()
        .replace('Icon_-_', '')
        .replace(/\.png$/i, '')
        .replace(/_/g, ' ');

      img.title = displayName;

      img.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        const selRow = document.querySelector('.party-row.party-selected');
        if (!selRow) return;
        const emptySlot = [...selRow.querySelectorAll('[data-slot]')].find(s => s.children.length === 0);
        if (!emptySlot) return;

        emptySlot.innerHTML = '';
        const newImg = document.createElement('img');
        newImg.src = charKey;
        newImg.className = 'w-full h-full object-contain';

        setupDragStart(newImg, charKey, selRow);

        newImg.addEventListener('contextmenu', (ev) => {
          ev.preventDefault();
          newImg.remove();
          updateBuffs();
        });

        emptySlot.appendChild(newImg);
        updateBuffs();
      });

      recommendListEl.appendChild(img);
    });
  }
}

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
        if (matched) {
          slot.classList.remove('ring-4','ring-yellow-400','scale-105','transition-transform','opacity-40','grayscale');
          if (label) label.remove();
        } else {
          slot.classList.remove('ring-4','ring-yellow-400','scale-105','transition-transform');
          slot.classList.add('opacity-40','grayscale');
          if (label) label.remove();
        }
      } else {
        if (matched) {
          slot.classList.add('ring-4','ring-yellow-400','scale-105','transition-transform');
          slot.classList.remove('opacity-40','grayscale');
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

  tooltip.style.visibility = 'hidden';
  document.body.appendChild(tooltip);
  _buffEntriesTooltip = tooltip;

  const rect = targetEl.getBoundingClientRect();
  const ttRect = tooltip.getBoundingClientRect();
  const margin = 8;

  let left = rect.right + margin;
  const rightLimit = window.innerWidth - margin;
  if (left + ttRect.width > rightLimit) {
    left = rect.left - ttRect.width - margin;
    if (left < margin) {
      left = Math.max(margin, rightLimit - ttRect.width);
    }
  }

  let top = rect.top;
  const bottomLimit = window.innerHeight - margin;
  if (top + ttRect.height > bottomLimit) top = bottomLimit - ttRect.height;
  if (top < margin) top = margin;

  tooltip.style.left = `${left}px`;
  tooltip.style.top = `${top}px`;
  tooltip.classList.add('visible');
}

function removeEntriesTooltip() {
  if (_buffEntriesTooltip) {
    _buffEntriesTooltip.classList.remove('visible');
    const el = _buffEntriesTooltip;
    _buffEntriesTooltip = null;
    setTimeout(() => {
      if (el && el.parentNode) el.parentNode.removeChild(el);
    }, 180);
  }
}

function updateBuffsForRow(rowIndex) {
  const row = partyRows[rowIndex];
  const imgs = row.querySelectorAll("img");

  const buffList = [];
  const debuffList = [];

  imgs.forEach((img) => {
    const srcKey = Object.keys(charData).find(k => img.src.includes(k.replace("pics/", "")));
    const info = srcKey ? charData[srcKey] : null;
    if (info) {
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

partyRows.forEach((row, index) => {
  row.addEventListener('click', (e) => {
    if (e.target.closest('#buff-section')) return;
    setRowSelected(row);
    activeRowIndex = index;
    updateBuffsForRow(index);
    e.stopPropagation();
  });
});

// ---------- Compare modal ----------
function getMergedForRowElement(rowEl) {
  const imgs = Array.from(rowEl.querySelectorAll('img'));
  const allBuffs = [];
  const allDebuffs = [];
  
  const uniqueCharSources = new Set();
  imgs.forEach(img => {
    const srcKey = Object.keys(charData).find(k => img.src.includes(k.replace('pics/', '')));
    if (srcKey) {
      uniqueCharSources.add(srcKey);
    }
  });

  uniqueCharSources.forEach(srcKey => {
    const info = charData[srcKey];
    if (info) {
      info.buffs.forEach(b => allBuffs.push({ buff: b, charName: srcKey }));
      info.debuffs.forEach(d => allDebuffs.push({ buff: d, charName: srcKey }));
    }
  });
  
  return mergeBuffsAndDebuffs(allBuffs, allDebuffs);
}

async function showCompareModal(selectedIndex) {
  const selRow = partyRows[selectedIndex];
  if (!selRow) return;
  const textBoxes = Array.from(document.querySelectorAll('#custom-text-slot'));
  const selLabel =
    textBoxes[selectedIndex]?.innerText?.trim() ||
    `แถวที่ ${selectedIndex + 1}`;

  const selResult = getMergedForRowElement(selRow) || {};
  const selBuffs = selResult.mergedBuffs || [];
  const selDebuffs = selResult.mergedDebuffs || [];

  const nameEls = Array.from(document.querySelectorAll('#custom-text-slot'));
  if (nameEls.length < 2) {
    Swal.fire('ข้อมูล', 'ต้องมีแถวอื่นอย่างน้อย 1 แถว', 'info');
    return;
  }

    let optionHtml = '';
    nameEls.forEach((el, i) => {
      if (i === selectedIndex) return;
      const label = (el && el.innerText && el.innerText.trim())
        ? el.innerText.trim()
        : `แถวที่ ${i + 1}`;
      optionHtml += `<option value="${i}">${escapeHtml(label)}</option>`;
    });
    const { value: targetIndex } = await Swal.fire({
    title: `
      <div class="w-full text-center text-pink-300 font-bold text-2xl tracking-wide 
                  drop-shadow-[0_0_8px_#ff4dd4] mt-1">เลือกแถวที่ต้องการเปรียบเทียบ
      </div>
    `,

    html: `
      <div class="flex flex-col gap-4 text-left w-[325px] px-4 mx-auto">
        <!-- แถวปัจจุบัน -->
        <div>
          <div class="text-pink-200 text-sm mb-1 opacity-90 text-center"> แถวปัจจุบัน :</div>
        <div class="w-[85%] mx-auto">
        <div class="
          w-full px-3 py-2 rounded-xl bg-gray-800 border border-pink-500/30 
          text-pink-200 opacity-80 cursor-not-allowed select-none
          shadow-[0_0_10px_rgba(255,20,147,0.25)] text-center
        ">
          ${escapeHtml(selLabel)}
        </div>
      </div>
    </div>

      <!-- เส้นคั่น -->
      <div class="border-b border-pink-500/30 my-1"></div>

      <!-- เลือกแถวเป้าหมาย -->
        <div>
          <div class="text-pink-200 text-sm mb-1 opacity-90 text-center">เลือกแถวที่ต้องการเปรียบเทียบ :</div>
          <div class="w-[85%] mx-auto">
            <select id="swal-compare-select"
              class="
                w-full px-3 py-2 rounded-xl bg-gray-900 text-pink-200 border border-pink-500/40 text-center 
                shadow-[0_0_12px_rgba(255,20,147,0.35)]
                focus:outline-none focus:ring-2 focus:ring-pink-500
              ">${optionHtml}
            </select>
          </div>
        </div>
        <!-- เส้นคั่น -->
        <div class="border-b border-pink-500/30 my-1"></div>
      </div>
      `     ,

    width: "520px",
    background: "#111",

    showCancelButton: true,
    confirmButtonText: "เปรียบเทียบ",
    cancelButtonText: "ยกเลิก",

    customClass: {
      popup: "swal2-neon-popup",
      title: "swal2-neon-title",
      actions: "swal2-neon-actions flex justify-center gap-6 mt-2",
      confirmButton: "swal2-neon-confirm font-bold px-6 py-2 rounded-xl",
      cancelButton: "swal2-neon-cancel font-bold px-5 py-2 rounded-xl"
    } ,

        preConfirm: () => {
          const sel = document.getElementById("swal-compare-select");
          return sel ? parseInt(sel.value, 10) : null;
        }
      });



      if (typeof targetIndex !== 'number' || isNaN(targetIndex)) return;
      const tgtRow = partyRows[targetIndex];
      const tgtResult = getMergedForRowElement(tgtRow) || {};
      const tgtBuffs = tgtResult.mergedBuffs || [];
      const tgtDebuffs = tgtResult.mergedDebuffs || [];
      const tgtLabel =
        textBoxes[targetIndex]?.innerText?.trim() ||
        `แถวที่ ${targetIndex + 1}`;
      const buffMap = buildCompareMap(selBuffs, tgtBuffs);
      const debuffMap = buildCompareMap(selDebuffs, tgtDebuffs);

      let table = `
        <div style="overflow:auto; max-height:300px;">
          <table id="compare-table" style="width:100%; border-collapse:collapse; font-size:16px;">
            <thead>
              <tr style="background: rgba(236,72,153,0.18);">
                <th style="width:20%; text-align:center;">${escapeHtml(selLabel)}</th>
                <th style="width:6%;"></th>
                <th style="width:48%; text-align:center;">
                  <div class="compare-segment">
                    <button class="active" data-type="buff">Buffs</button>
                    <button data-type="debuff">Debuffs</button>
                  </div>
                </th>
                <th style="width:6%;"></th>
                <th style="width:20%; text-align:center;">${escapeHtml(tgtLabel)}</th>
              </tr>
            </thead>
            <tbody></tbody>
          </table>
        </div>
        `;

      await Swal.fire({
        title: 'ผลการเปรียบเทียบ',
        html: table,
        width: '42%',
        allowOutsideClick: false,
        showCloseButton: true,
        showConfirmButton: false,
        didOpen: () => {
          initCompareTable({
            buffMap,
            debuffMap
          });
        },
        customClass: {
          popup: 'swal-compare-popup',
          title: 'swal-compare-title'
        }
      });


    }

    // ------------------------ ปุ่มเปรียบเทียบ ------------------------
    document.querySelectorAll('.compare-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const selectedRow = document.querySelector('.party-row.party-selected');
        let selectedIdx;
        if (!selectedRow) {
          const rowIndex = [...partyRows].indexOf(btn.closest('.party-row'));
          setRowSelected(partyRows[rowIndex]);
          activeRowIndex = rowIndex;
          selectedIdx = rowIndex;
        } else {
          selectedIdx = [...partyRows].indexOf(selectedRow);
        }
        showCompareModal(selectedIdx);
      });
    });

    document.addEventListener("click", (e) => {
    const isInsidePartyRow = e.target.closest(".party-row");
    const isInsideBuffSection = e.composedPath().some(
      (el) => el.id === "buff-section"
    );
    createClickEffect(e);

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


function createClickEffect(e) {
  const effect = document.createElement("div");
  effect.className = "click-effect";

  effect.innerHTML = `
    <img src="assets/sakura.png" class="sakura-icon" />
  `;

  effect.style.left = `${e.pageX}px`;
  effect.style.top = `${e.pageY}px`;

  document.body.appendChild(effect);

  setTimeout(() => effect.remove(), 900);
}

const helpBtn = document.getElementById('help-btn');
const helpModal = document.getElementById('help-modal');
const helpClose = document.getElementById('help-close');

helpBtn.addEventListener('click', () => {
  helpModal.classList.remove('hidden');
});

helpClose.addEventListener('click', () => {
  helpModal.classList.add('hidden');
});

helpModal.addEventListener('click', (e) => {
  if (e.target === helpModal) {
    helpModal.classList.add('hidden');
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    helpModal.classList.add('hidden');
  }
});