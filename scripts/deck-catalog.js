import fs from 'node:fs/promises';
import path from 'node:path';

async function assertFile(filePath, label) {
  const stats = await fs.stat(filePath).catch(() => null);
  if (!stats?.isFile()) {
    throw new Error(`${label} non trovato: ${filePath}`);
  }
}

function resolveInside(parentDir, relativePath, label) {
  const resolved = path.resolve(parentDir, relativePath);
  const relative = path.relative(parentDir, resolved);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(`${label} punta fuori dalla cartella assets: ${relativePath}`);
  }
  return resolved;
}

export async function loadAndValidateDeckCatalog(projectRoot) {
  const manifestPath = path.resolve(projectRoot, 'src', 'data', 'decks.json');
  const publicAssetsDir = path.resolve(projectRoot, 'public', 'assets');
  const rawManifest = await fs.readFile(manifestPath, 'utf8');
  const manifest = JSON.parse(rawManifest);
  const decks = Array.isArray(manifest.decks)
    ? manifest.decks.filter((deck) => deck?.enabled !== false)
    : [];

  if (manifest.schemaVersion !== 1 || decks.length === 0) {
    throw new Error('Il catalogo mazzi deve usare schemaVersion 1 e contenere almeno un mazzo attivo.');
  }

  const ids = new Set();
  for (const deck of decks) {
    if (!Number.isInteger(deck.id) || deck.id < 0 || ids.has(deck.id)) {
      throw new Error(`ID mazzo non valido o duplicato: ${String(deck.id)}`);
    }
    ids.add(deck.id);

    if (!String(deck.label || '').trim()) {
      throw new Error(`Il mazzo ${deck.id} non ha un'etichetta.`);
    }
    if (!Number.isInteger(deck.cardCount) || deck.cardCount < 1 || deck.cardCount > 200) {
      throw new Error(`cardCount non valido per il mazzo ${deck.id}.`);
    }
    if (!String(deck.cardImagePattern || '').includes('{n}')) {
      throw new Error(`cardImagePattern del mazzo ${deck.id} deve contenere {n}.`);
    }

    const deckDir = resolveInside(publicAssetsDir, `mazzo_${deck.id}`, `Mazzo ${deck.id}`);
    await assertFile(
      resolveInside(deckDir, deck.frontImageName || 'card_front.jpg', `Fronte mazzo ${deck.id}`),
      `Fronte mazzo ${deck.id}`,
    );
    await assertFile(
      resolveInside(deckDir, deck.previewImageName || deck.frontImageName || 'card_front.jpg', `Anteprima mazzo ${deck.id}`),
      `Anteprima mazzo ${deck.id}`,
    );

    for (let number = 1; number <= deck.cardCount; number += 1) {
      const filename = String(deck.cardImagePattern).replace('{n}', String(number));
      await assertFile(
        resolveInside(path.join(deckDir, 'cards'), filename, `Carta ${number} del mazzo ${deck.id}`),
        `Carta ${number} del mazzo ${deck.id}`,
      );
    }
  }

  if (!ids.has(manifest.defaultDeckId)) {
    throw new Error(`Il mazzo predefinito ${String(manifest.defaultDeckId)} non è attivo.`);
  }

  return { manifest, manifestPath, rawManifest, decks };
}

