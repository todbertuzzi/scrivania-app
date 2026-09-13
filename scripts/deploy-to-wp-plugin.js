import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { loadAndValidateDeckCatalog } from './deck-catalog.js';

async function exists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

async function copyFile(src, dest) {
  await ensureDir(path.dirname(dest));
  await fs.copyFile(src, dest);
}

async function copyDir(srcDir, destDir) {
  await ensureDir(destDir);
  const entries = await fs.readdir(srcDir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === '.DS_Store') {
      continue;
    }
    const src = path.join(srcDir, entry.name);
    const dest = path.join(destDir, entry.name);
    if (entry.isDirectory()) {
      await copyDir(src, dest);
    } else if (entry.isFile()) {
      await copyFile(src, dest);
    }
  }
}

async function resetGeneratedDir(dirPath, allowedParent, expectedName) {
  const resolvedDir = path.resolve(dirPath);
  const resolvedParent = path.resolve(allowedParent);
  if (path.dirname(resolvedDir) !== resolvedParent || path.basename(resolvedDir) !== expectedName) {
    throw new Error(`Pulizia rifiutata per percorso non previsto: ${resolvedDir}`);
  }

  await fs.rm(resolvedDir, { recursive: true, force: true });
  await ensureDir(resolvedDir);
}

async function main() {
  const projectRoot = process.cwd();

  const distDir = path.resolve(projectRoot, 'dist');
  const distJs = path.join(distDir, 'scrivania-app.js');
  const distCss = path.join(distDir, 'scrivania-assets', 'index.css');
  const publicAssetsDir = path.resolve(projectRoot, 'public', 'assets');
  const srcBgsDir = path.resolve(projectRoot, 'src', 'assets', 'bgs');

  const pluginDir = path.resolve(projectRoot, '..', 'remote_inner', 'plugins', 'scrivania-collaborativa-api');
  const pluginAppDir = path.join(pluginDir, 'js', 'app');
  const pluginConfigDir = path.join(pluginDir, 'config');

  // Valida l'intero catalogo prima di toccare gli artefatti generati nel plugin.
  const { rawManifest, decks } = await loadAndValidateDeckCatalog(projectRoot);

  if (!(await exists(distJs))) {
    throw new Error(`Build JS non trovato: ${distJs}. Esegui prima \`npm run build\`.`);
  }

  console.log('Deploy build → plugin WP');
  console.log(`- Plugin dir: ${pluginDir}`);
  console.log(`- Catalogo validato: ${decks.length} mazzi`);

  await ensureDir(pluginAppDir);
  await ensureDir(pluginConfigDir);

  await copyFile(
    path.resolve(projectRoot, 'src', 'data', 'decks.json'),
    path.join(pluginConfigDir, 'decks.json'),
  );
  console.log(`- Sincronizzato catalogo mazzi (${JSON.parse(rawManifest).schemaVersion})`);

  // JS bundle
  await copyFile(distJs, path.join(pluginAppDir, 'scrivania-app.js'));
  console.log('- Copiato scrivania-app.js');

  // CSS bundle (se presente)
  if (await exists(distCss)) {
    await resetGeneratedDir(path.join(pluginAppDir, 'scrivania-assets'), pluginAppDir, 'scrivania-assets');
    await copyFile(distCss, path.join(pluginAppDir, 'scrivania-assets', 'index.css'));
    console.log('- Copiato index.css');
  } else {
    console.log('- CSS non trovato, skip');
  }

  // Static assets (immagini)
  if (await exists(publicAssetsDir)) {
    await resetGeneratedDir(path.join(pluginAppDir, 'assets'), pluginAppDir, 'assets');
    await copyDir(publicAssetsDir, path.join(pluginAppDir, 'assets'));
    console.log('- Copiati assets statici');
  } else {
    console.log('- public/assets non trovato, skip');
  }

  // Backgrounds aggiuntivi da src/assets/bgs (per gli sfondi della plancia)
  if (await exists(srcBgsDir)) {
    await copyDir(srcBgsDir, path.join(pluginAppDir, 'assets', 'bgs'));
    console.log('- Copiati background da src/assets/bgs');
  } else {
    console.log('- src/assets/bgs non trovato, skip background');
  }

  console.log('Deploy completato.');
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
