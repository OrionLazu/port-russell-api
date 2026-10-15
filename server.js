/**
 * @file Point d'entrée : connexion à MongoDB puis démarrage du serveur HTTP.
 * @module server
 */

require('dotenv').config({ quiet: true });

const app = require('./app');
const { connectDatabase } = require('./config/db');

const PORT = Number(process.env.PORT) || 3000;

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
  });
}

if (require.main === module) {
  start();
}

module.exports = { start };
