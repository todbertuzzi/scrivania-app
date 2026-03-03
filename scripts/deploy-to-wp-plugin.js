import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

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
    const src = path.join(srcDir, entry.name);
    const dest = path.join(destDir, entry.name);
    if (entry.isDirectory()) {
      await copyDir(src, dest);
    } else if (entry.isFile()) {
      await copyFile(src, dest);
    }
  }
}

async function main() {
  const projectRoot = process.cwd();

  const distDir = path.resolve(projectRoot, 'dist');
  const distJs = path.join(distDir, 'scrivania-app.js');
  const distCss = path.join(distDir, 'scrivania-assets', 'index.css');
  const publicAssetsDir = path.resolve(projectRoot, 'public', 'assets');

  const pluginDir = path.resolve(projectRoot, '..', 'remote_inner', 'plugins', 'scrivania-collaborativa-api');
  const pluginAppDir = path.join(pluginDir, 'js', 'app');

  if (!(await exists(distJs))) {
    throw new Error(`Build JS non trovato: ${distJs}. Esegui prima \`npm run build\`.`);
  }

  console.log('Deploy build → plugin WP');
  console.log(`- Plugin dir: ${pluginDir}`);

  await ensureDir(pluginAppDir);

  // JS bundle
  await copyFile(distJs, path.join(pluginAppDir, 'scrivania-app.js'));
  console.log('- Copiato scrivania-app.js');

  // CSS bundle (se presente)
  if (await exists(distCss)) {
    await copyFile(distCss, path.join(pluginAppDir, 'scrivania-assets', 'index.css'));
    console.log('- Copiato index.css');
  } else {
    console.log('- CSS non trovato, skip');
  }

  // Static assets (immagini)
  if (await exists(publicAssetsDir)) {
    await copyDir(publicAssetsDir, path.join(pluginAppDir, 'assets'));
    console.log('- Copiati assets statici');
  } else {
    console.log('- public/assets non trovato, skip');
  }

  console.log('Deploy completato.');
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
