const PARTY_COLORS = ['#FFE6E6', '#FFC6C6', '#F7B5CA', '#F0A8D0'];

function buildSlotMarkup() {
  return Array.from({ length: 8 }, (_, i) => (
    `<div class="w-[90px] h-[90px] bg-gray-700 border-2 flex items-center justify-center" data-slot="${i}"></div>`
  )).join('');
}

function buildRowMarkup(rowIndex) {
  return `
    <div class="party-row bg-gray-800 rounded-lg p-2 flex gap-2 overflow-x-auto mb-4">
      <div class="custom-text-slot w-[90px] h-[90px] text-black font-bold text-center p-2 flex items-center justify-center rounded-md cursor-text break-all whitespace-pre-wrap"
          style="background:${PARTY_COLORS[rowIndex]}" contenteditable="true">Party ${rowIndex + 1}</div>
      ${buildSlotMarkup()}
      <div class="ml-auto flex gap-2">
        <div class="w-[90px] h-[90px] bg-gray-800 flex items-center justify-center text-pink-400 hover:text-pink-300 cursor-pointer clear-btn relative group">
          <i data-lucide="brush-cleaning" class="w-10 h-10 transition-transform active:scale-90"></i>
          <span class="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-gray-900 px-2 py-1 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity" data-i18n="ui.brush_desc">Clear Entire Row</span>
        </div>
        <div class="w-[90px] h-[90px] bg-gray-800 flex items-center justify-center text-pink-400 hover:text-pink-300 cursor-pointer compare-btn relative group">
          <i data-lucide="columns" class="w-8 h-8 transition-transform active:scale-90"></i>
          <span class="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-gray-900 px-2 py-1 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity">Compare with other rows</span>
        </div>
        <div class="w-[90px] h-[90px] bg-gray-800 flex items-center justify-center text-pink-400 hover:text-pink-300 cursor-pointer scroll-btn relative group">
          <i data-lucide="scroll-text" class="w-10 h-10 transition-transform active:scale-90"></i>
          <span class="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-gray-900 px-2 py-1 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity">Scroll Buffs</span>
        </div>
      </div>
    </div>`;
}

export function renderPartyRows(containerId = 'party-rows-container', rowCount = 4) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = Array.from({ length: rowCount }, (_, i) => buildRowMarkup(i)).join('');
}