#!/usr/bin/env node
import { execSync } from 'child_process';
import { copyFileSync, mkdirSync, existsSync, rmSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configurazione
const WORDPRESS_PLUGIN_PATH = '../remote_inner/plugins/scrivania-collaborativa-api/js/app';
const isDev = process.argv.includes('--dev');

console.log(`🚀 Deploy ${isDev ? 'DEVELOPMENT' : 'PRODUCTION'} in corso...`);

try {
  // 1. Build dell'app
  console.log('📦 Building app...');
  execSync(isDev ? 'npm run build' : 'npm run build:prod', { stdio: 'inherit' });
  
  // 2. Pulisci la destinazione
  const targetPath = join(__dirname, '..', WORDPRESS_PLUGIN_PATH);
  if (existsSync(targetPath)) {
    console.log('🧹 Pulizia directory di destinazione...');
    rmSync(targetPath, { recursive: true, force: true });
  }
  mkdirSync(targetPath, { recursive: true });
  
  // 3. Copia i file buildati
  console.log('📋 Copia dei file...');
  
  // Copia il file JS principale
  copyFileSync(
    join(__dirname, '../dist/scrivania-app.js'),
    join(targetPath, 'scrivania-app.js')
  );
  
  // Copia gli assets (immagini, CSS, etc.)
  const distPath = join(__dirname, '../dist');
  execSync(`cp -r ${distPath}/* ${targetPath}/`, { stdio: 'inherit' });
  
  console.log('✅ Deploy completato con successo!');
  console.log(`📁 File copiati in: ${targetPath}`);
  
} catch (error) {
  console.error('❌ Errore durante il deploy:', error.message);
  process.exit(1);
}