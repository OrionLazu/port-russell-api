/**
 * @file Connexion à la base MongoDB via Mongoose.
 * @module config/db
 */

const mongoose = require('mongoose');

// Neutralise les opérateurs MongoDB ($gt, $ne...) injectés dans les filtres.
mongoose.set('sanitizeFilter', true);
mongoose.set('strictQuery', true);

/**
 * Ouvre la connexion à MongoDB.
 *
 * @param {string} uri - Chaîne de connexion MongoDB.
 * @returns {Promise<Object>} L'instance Mongoose connectée.
 * @throws {Error} Si l'URI est absente ou si la connexion échoue.
 */
async function connectDatabase(uri) {
  if (!uri) {
    throw new Error('La variable MONGODB_URI est manquante.');
  }
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  return mongoose;
}

/**
 * Ferme la connexion à MongoDB.
 *
 * @returns {Promise<void>}
 */
async function disconnectDatabase() {
  await mongoose.disconnect();
}

module.exports = { connectDatabase, disconnectDatabase };
