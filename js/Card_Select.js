import { Analytics } from "../database/analytics.js";

const CARD_EFFECTS = {
  aquarius: ['atk_mag_up_10'],
  gemini: ['damage_block_80'],
  leo: ['def_up_40', 'max_hp_40'],
  scorpio: []
};

const MAX_SELECTED_CARDS = 2;
const selectedCards = new Set(['aquarius', 'scorpio']);

export function setupCardSelection(onSelectionChange) {
  const cardButtons = document.querySelectorAll('.card-hover-item[data-card]');
  cardButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const cardName = button.dataset.card;
      if (!cardName) return;

      if (selectedCards.has(cardName)) {
        selectedCards.delete(cardName);
      } else {
        if (selectedCards.size >= MAX_SELECTED_CARDS) return;
        selectedCards.add(cardName);
      }

      applyCardSelectionUI();
      Analytics.trackCharacter(cardName);
      if (typeof onSelectionChange === 'function') onSelectionChange();
    });
  });

  applyCardSelectionUI();
}

function applyCardSelectionUI() {
  const cardButtons = document.querySelectorAll('.card-hover-item[data-card]');
  cardButtons.forEach((button) => {
    const cardName = button.dataset.card;
    const isSelected = selectedCards.has(cardName);
    button.classList.toggle('ring-4', isSelected);
    button.classList.toggle('ring-amber-300', isSelected);
    button.classList.toggle('ring-offset-1', isSelected);
    button.classList.toggle('ring-offset-gray-900', isSelected);
    button.classList.toggle('opacity-70', !isSelected);

    const checkIcon = button.querySelector('.card-check');
    if (checkIcon) {
      checkIcon.classList.toggle('hidden', !isSelected);
    }
  });
}

export function getSelectedCardEffects() {
  const effects = [];
  selectedCards.forEach((cardName) => {
    const cardEffects = CARD_EFFECTS[cardName] || [];
    effects.push(...cardEffects);
  });
  return effects;
}