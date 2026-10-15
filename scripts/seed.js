/**
 * @file Alimente la base MongoDB avec les données fournies (data/catways.json
 * et data/reservations.json) et crée le compte de la capitainerie.
 *
 * Usage : npm run seed
 * Les collections catways et reservations sont vidées puis rechargées.
 * Le compte administrateur est créé s'il n'existe pas encore.
 * @module scripts/seed
 */

require('dotenv').config({ quiet: true });

const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const { connectDatabase, disconnectDatabase } = require('../config/db');
const Catway = require('../models/Catway');
const Reservation = require('../models/Reservation');
const User = require('../models/User');

/**
 * Lit un fichier JSON du dossier data.
 *
 * @param {string} name - Nom du fichier.
 * @returns {Array<Object>} Le contenu du fichier.
 */
function readData(name) {
  return JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', name), 'utf8'));
}

/**
 * Exécute l'import.
 *
 * @returns {Promise<void>}
 */
async function seed() {
  await connectDatabase(process.env.MONGODB_URI);

  const catways = readData('catways.json');
  const reservations = readData('reservations.json');

  await Catway.deleteMany({});
  await Reservation.deleteMany({});
  await Catway.insertMany(catways);
  await Reservation.insertMany(reservations);
  console.log(`[seed] ${catways.length} catways et ${reservations.length} réservations importés.`);

  const { ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
  if (ADMIN_EMAIL && ADMIN_PASSWORD) {
    const email = ADMIN_EMAIL.trim().toLowerCase();
    if (await User.exists({ email })) {
      console.log(`[seed] Le compte ${email} existe déjà.`);
    } else {
      await User.create({
        name: ADMIN_NAME || 'Capitainerie',
        email,
        password: await bcrypt.hash(ADMIN_PASSWORD, 10),
      });
      console.log(`[seed] Compte ${email} créé.`);
    }
  } else {
    console.log('[seed] ADMIN_EMAIL / ADMIN_PASSWORD absents : aucun compte créé.');
  }
}

seed()
  .catch((error) => {
    console.error('[seed] Échec :', error.message);
    process.exitCode = 1;
  })
  .finally(disconnectDatabase);
