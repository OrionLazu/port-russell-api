/**
 * @file Logique métier des catways.
 * @module services/catwayService
 */

const Catway = require('../models/Catway');
const Reservation = require('../models/Reservation');
const { ErrorKind, ServiceError, fromMongooseError } = require('./errors');

/**
 * Convertit et contrôle un numéro de catway.
 *
 * @param {*} value - Valeur reçue (chaîne ou nombre).
 * @returns {number} Le numéro sous forme d'entier positif.
 * @throws {ServiceError} Si la valeur n'est pas un entier positif.
 */
function parseCatwayNumber(value) {
  const number = typeof value === 'number' ? value : Number(String(value ?? '').trim());
  if (!Number.isInteger(number) || number < 1) {
    throw new ServiceError(ErrorKind.VALIDATION, 'Le numéro du catway doit être un entier positif.');
  }
  return number;
}

/**
 * Ne garde que les champs modifiables d'un catway, convertis en chaîne.
 *
 * @param {Object} data - Données reçues.
 * @returns {{type: (string|undefined), catwayState: (string|undefined)}} Champs retenus.
 */
function pickEditableFields(data = {}) {
  const fields = {};
  if (data.type !== undefined) fields.type = String(data.type).trim();
  if (data.catwayState !== undefined) fields.catwayState = String(data.catwayState).trim();
  return fields;
}

/**
 * Liste tous les catways, triés par numéro.
 *
 * @returns {Promise<Array<Object>>} Les catways.
 */
async function listCatways() {
  return Catway.find().sort({ catwayNumber: 1 }).lean();
}

/**
 * Récupère un catway par son numéro.
 *
 * @param {number|string} catwayNumber - Numéro du catway.
 * @returns {Promise<Object>} Le catway trouvé.
 * @throws {ServiceError} NOT_FOUND si le catway n'existe pas.
 */
async function getCatway(catwayNumber) {
  const number = parseCatwayNumber(catwayNumber);
  const catway = await Catway.findOne({ catwayNumber: number }).lean();
  if (!catway) {
    throw new ServiceError(ErrorKind.NOT_FOUND, `Le catway n°${number} n'existe pas.`);
  }
  return catway;
}

/**
 * Crée un catway.
 *
 * @param {{catwayNumber: (number|string), type: string, catwayState: string}} data - Données du catway.
 * @returns {Promise<Object>} Le catway créé.
 * @throws {ServiceError} VALIDATION si les données sont invalides, CONFLICT si le numéro existe déjà.
 */
async function createCatway(data = {}) {
  const catwayNumber = parseCatwayNumber(data.catwayNumber);
  if (await Catway.exists({ catwayNumber })) {
    throw new ServiceError(ErrorKind.CONFLICT, `Le catway n°${catwayNumber} existe déjà.`);
  }
  try {
    const catway = await Catway.create({ catwayNumber, ...pickEditableFields(data) });
    return catway.toObject();
  } catch (error) {
    throw fromMongooseError(error);
  }
}

/**
 * Remplace entièrement un catway (méthode PUT).
 * Le numéro ne peut pas être modifié : c'est l'identifiant de la ressource.
 *
 * @param {number|string} catwayNumber - Numéro du catway à remplacer.
 * @param {{type: string, catwayState: string, catwayNumber: ((number|string)|undefined)}} data - Nouvelles données complètes.
 * @returns {Promise<Object>} Le catway mis à jour.
 * @throws {ServiceError} VALIDATION si un champ manque, NOT_FOUND si le catway n'existe pas.
 */
async function replaceCatway(catwayNumber, data = {}) {
  const number = parseCatwayNumber(catwayNumber);
  if (data.catwayNumber !== undefined && parseCatwayNumber(data.catwayNumber) !== number) {
    throw new ServiceError(ErrorKind.VALIDATION, 'Le numéro du catway ne peut pas être modifié.');
  }
  const fields = pickEditableFields(data);
  const missing = ['type', 'catwayState'].filter((key) => !fields[key]);
  if (missing.length) {
    throw new ServiceError(
      ErrorKind.VALIDATION,
      'La méthode PUT remplace tout le catway : tous les champs sont obligatoires.',
      missing.map((key) => `Le champ « ${key} » est manquant.`)
    );
  }
  return updateCatwayFields(number, fields);
}

/**
 * Modifie partiellement un catway (méthode PATCH),
 * typiquement la description de son état.
 *
 * @param {number|string} catwayNumber - Numéro du catway.
 * @param {{type: (string|undefined), catwayState: (string|undefined)}} data - Champs à modifier.
 * @returns {Promise<Object>} Le catway mis à jour.
 * @throws {ServiceError} VALIDATION si aucun champ n'est fourni, NOT_FOUND si le catway n'existe pas.
 */
async function updateCatway(catwayNumber, data = {}) {
  const number = parseCatwayNumber(catwayNumber);
  if (data.catwayNumber !== undefined && parseCatwayNumber(data.catwayNumber) !== number) {
    throw new ServiceError(ErrorKind.VALIDATION, 'Le numéro du catway ne peut pas être modifié.');
  }
  const fields = pickEditableFields(data);
  if (!Object.keys(fields).length) {
    throw new ServiceError(ErrorKind.VALIDATION, 'Aucun champ à modifier (type ou catwayState).');
  }
  return updateCatwayFields(number, fields);
}

/**
 * Applique des modifications validées à un catway.
 *
 * @private
 * @param {number} catwayNumber - Numéro du catway.
 * @param {Object} fields - Champs à écrire.
 * @returns {Promise<Object>} Le catway mis à jour.
 */
async function updateCatwayFields(catwayNumber, fields) {
  try {
    const catway = await Catway.findOneAndUpdate({ catwayNumber }, fields, {
      returnDocument: 'after',
      runValidators: true,
    }).lean();
    if (!catway) {
      throw new ServiceError(ErrorKind.NOT_FOUND, `Le catway n°${catwayNumber} n'existe pas.`);
    }
    return catway;
  } catch (error) {
    throw fromMongooseError(error);
  }
}

/**
 * Supprime un catway ainsi que ses réservations.
 *
 * @param {number|string} catwayNumber - Numéro du catway.
 * @returns {Promise<{catway: Object, deletedReservations: number}>} Le catway supprimé et le nombre de réservations supprimées.
 * @throws {ServiceError} NOT_FOUND si le catway n'existe pas.
 */
async function deleteCatway(catwayNumber) {
  const number = parseCatwayNumber(catwayNumber);
  const catway = await Catway.findOneAndDelete({ catwayNumber: number }).lean();
  if (!catway) {
    throw new ServiceError(ErrorKind.NOT_FOUND, `Le catway n°${number} n'existe pas.`);
  }
  const { deletedCount } = await Reservation.deleteMany({ catwayNumber: number });
  return { catway, deletedReservations: deletedCount };
}

module.exports = {
  parseCatwayNumber,
  listCatways,
  getCatway,
  createCatway,
  replaceCatway,
  updateCatway,
  deleteCatway,
};
