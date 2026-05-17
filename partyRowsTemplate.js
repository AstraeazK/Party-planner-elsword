const PARTY_COLORS = ['#FFE6E6', '#FFC6C6', '#F7B5CA', '#F0A8D0'];

function buildSlotMarkup() {
  return Array.from({ length: 8 }, (_, i) => (
    `<div class="w-[90px] h-[90px] bg-gray-700 border-2 flex items-center justify-center" data-slot="${i}"></div>`
  )).join('');
}

function getRowColor(rowIndex) {
  return PARTY_COLORS[rowIndex % PARTY_COLORS.length];
}

function buildRowMarkup(rowIndex, partyNumber = rowIndex + 1) {
  const hasDeleteButton = rowIndex >= 4;
  const rowPaddingClass = 'pr-12';
  const deleteButton = hasDeleteButton
    ? `<button class="delete-row-btn absolute top-1/2 -translate-y-1/2 right-2 z-30 opacity-0 pointer-events-none transition-opacity" data-row-index="${rowIndex}" aria-label="Delete row">
         <img src="assets/Delete_row.png" alt="Delete row" class="w-7 h-7 object-contain">
       </button>`
    : '';

  return `
     <div class="party-row relative bg-gray-800/85 rounded-lg p-2 ${rowPaddingClass} flex gap-2 overflow-visible mb-4 mx-4 border border-pink-500/20 shadow-[0_0_10px_rgba(255,20,147,0.12)]">
      ${deleteButton}
      <div class="custom-text-slot w-[90px] h-[90px] text-black font-bold text-center p-2 flex items-center justify-center rounded-md cursor-text break-all whitespace-pre-wrap"
          style="background:${getRowColor(rowIndex)}" contenteditable="true">Party ${partyNumber}</div>
      ${buildSlotMarkup()}
      <div class="ml-auto flex gap-2">
        <div class="w-[90px] h-[90px] bg-gray-800 flex items-center justify-center text-pink-400 hover:text-pink-300 cursor-pointer clear-btn relative group" title="Clear Entire Row">
          <i data-lucide="brush-cleaning" class="w-10 h-10 transition-transform active:scale-90"></i>
          <span class="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-gray-900 px-2 py-1 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity z-20">Clear Entire Row</span>
        </div>
        <div class="w-[90px] h-[90px] bg-gray-800 flex items-center justify-center text-pink-400 hover:text-pink-300 cursor-pointer compare-btn relative group" title="Compare with other rows">
          <i data-lucide="columns" class="w-8 h-8 transition-transform active:scale-90"></i>
          <span class="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-gray-900 px-2 py-1 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity z-20">Compare with other rows</span>
        </div>
        <div class="w-[90px] h-[90px] bg-gray-800 flex items-center justify-center text-pink-400 hover:text-pink-300 cursor-pointer scroll-btn relative group" title="Scroll Buffs">
          <i data-lucide="scroll-text" class="w-10 h-10 transition-transform active:scale-90"></i>
          <span class="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-gray-900 px-2 py-1 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity z-20">Scroll Buffs</span>
        </div>
      </div>
    </div>`;
}

export function renderPartyRows(containerId = 'party-rows-container', rowCount = 4) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = Array.from({ length: rowCount }, (_, i) => buildRowMarkup(i)).join('');
}

export function appendPartyRow(containerId = 'party-rows-container', partyNumber = null) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const rowIndex = container.querySelectorAll('.party-row').length;
  const nextPartyNumber = Number.isInteger(partyNumber) ? partyNumber : rowIndex + 1;
  container.insertAdjacentHTML('beforeend', buildRowMarkup(rowIndex, nextPartyNumber));
}