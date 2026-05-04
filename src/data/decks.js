import { getDeckAssetPath } from "../utils/paths";

export const DEFAULT_DECK_ID = 0;

const buildDeckCardNumbers = (count) => Array.from({ length: count }, (_, index) => index + 1);

const PORTRAIT_LAYOUT = {
  orientation: "portrait",
  aspectRatio: "2 / 3",
  aspectRatioValue: 2 / 3,
  frameWidth: 96,
  trayWidth: 80,
  imageFit: "cover",
};

const LANDSCAPE_4_3_LAYOUT = {
  orientation: "landscape",
  aspectRatio: "4 / 3",
  aspectRatioValue: 4 / 3,
  frameWidth: 160,
  trayWidth: 112,
  imageFit: "cover",
};

const resolveCardImageFilename = (deck, number) => {
  const pattern = String(deck.cardImagePattern || "").trim();
  if (pattern.includes("{n}")) {
    return pattern.replace("{n}", String(number));
  }

  const prefix = String(deck.cardImagePrefix || "").trim();
  const extension = String(deck.cardImageExtension || "jpg").trim() || "jpg";
  if (!prefix) {
    return `card_${number}.${extension}`;
  }

  return `${prefix}${number}.${extension}`;
};

const buildTemplateCard = (deck, number) => ({
  id: `m${number}`,
  templateId: `m${number}`,
  mazzoId: deck.id,
  nome: `Carta ${number}`,
  img: getDeckAssetPath(deck.id, `cards/${resolveCardImageFilename(deck, number)}`),
  frontImg: getDeckAssetPath(deck.id, deck.frontImageName || "card_front.jpg"),
});

const DECK_DEFINITIONS = [
  {
    id: 0,
    key: "mazzo-0",
    label: "Mazzo 0",
    description: "verticale",
    frontImageName: "card_front.jpg",
    cardImagePattern: "NewVisionGameToolKit_image_{n}.jpg",
    layout: PORTRAIT_LAYOUT,
    cardNumbers: buildDeckCardNumbers(20),
  },
  {
    id: 1,
    key: "mazzo-1",
    label: "Mazzo 1",
    description: "orizzontale 4/3",
    frontImageName: "card_front.jpg",
    cardImagePattern: "kit_photo_{n}.jpg",
    layout: LANDSCAPE_4_3_LAYOUT,
    cardNumbers: buildDeckCardNumbers(20),
  },
];

export const SCRIVANIA_DECKS = DECK_DEFINITIONS.map((deck) => ({
  ...deck,
  frontImg: getDeckAssetPath(deck.id, deck.frontImageName || "card_front.jpg"),
  cards: deck.cardNumbers.map((number) => buildTemplateCard(deck, number)),
}));

const DECKS_BY_ID = new Map(SCRIVANIA_DECKS.map((deck) => [deck.id, deck]));

export const normalizeDeckId = (deckId) => {
  const parsedDeckId = Number(deckId);
  if (!Number.isFinite(parsedDeckId)) {
    return DEFAULT_DECK_ID;
  }

  return DECKS_BY_ID.has(parsedDeckId) ? parsedDeckId : DEFAULT_DECK_ID;
};

export const getDeckById = (deckId) => DECKS_BY_ID.get(normalizeDeckId(deckId)) || SCRIVANIA_DECKS[0];

export const getDeckCards = (deckId) => getDeckById(deckId).cards;

export const getDeckLayout = (deckId) => getDeckById(deckId).layout || PORTRAIT_LAYOUT;

export const getDeckFrontImage = (deckId) => getDeckById(deckId).frontImg;

export const getCardLayout = (cardDeckId, fallbackDeckId = DEFAULT_DECK_ID) => {
  const resolvedDeckId = Number.isFinite(Number(cardDeckId)) ? Number(cardDeckId) : fallbackDeckId;
  return getDeckLayout(resolvedDeckId);
};

export const getDefaultCardFrontImage = () => getDeckFrontImage(DEFAULT_DECK_ID);