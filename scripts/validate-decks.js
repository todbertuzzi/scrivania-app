import process from 'node:process';
import { loadAndValidateDeckCatalog } from './deck-catalog.js';

loadAndValidateDeckCatalog(process.cwd())
  .then(({ decks }) => {
    const cardTotal = decks.reduce((total, deck) => total + deck.cardCount, 0);
    console.log(`Catalogo mazzi valido: ${decks.length} mazzi, ${cardTotal} carte.`);
  })
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });

