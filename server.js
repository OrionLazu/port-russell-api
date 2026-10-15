/**
 * @file Point d'entrée : connexion à MongoDB, démarrage du serveur HTTP
 * puis exécution des tests Mocha, dont les résultats s'affichent dans la console.
 * @module server
 */

require('dotenv').config({ quiet: true });

const { spawn } = require('child_process');
const app = require('./app');
const { connectDatabase } = require('./config/db');

const PORT = Number(process.env.PORT) || 3000;

/**
 * Lance la suite de tests Mocha dans un processus séparé.
 * Les tests utilisent une base MongoDB en mémoire : ils ne touchent jamais
 * aux données réelles du port.
 *
 * @returns {void}
 */
function runTestsOnStart() {
  if (process.env.RUN_TESTS_ON_START === 'false') return;

  let mochaBin;
  try {
    mochaBin = require.resolve('mocha/bin/mocha.js');
  } catch {
    console.warn('[tests] Mocha n’est pas installé : tests ignorés (npm install --include=dev).');
    return;
  }

  console.log('[tests] Lancement des tests Mocha…');
  const child = spawn(process.execPath, [mochaBin], {
    cwd: __dirname,
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'test' },
  });
  child.on('exit', (code) => {
    console.log(code === 0
      ? '[tests] Tous les tests sont passés.'
      : `[tests] Des tests ont échoué (code ${code}).`);
  });
}

/**
 * Démarre l'application.
 *
 * @returns {Promise<void>}
 */
async function start() {
  try {
    await connectDatabase(process.env.MONGODB_URI);
    console.log('[db] Connexion à MongoDB établie.');
  } catch (error) {
    console.error('[db] Connexion à MongoDB impossible :', error.message);
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`[server] Port de plaisance Russell à l'écoute sur http://localhost:${PORT}`);
    runTestsOnStart();
  });
}

if (require.main === module) {
  start();
}

module.exports = { start, runTestsOnStart };
