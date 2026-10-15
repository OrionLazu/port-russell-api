/**
 * @file Logique métier des réservations (sous-ressource des catways).
 * @module services/reservationService
 */

const mongoose = require('mongoose');
const Reservation = require('../models/Reservation');
const { getCatway, parseCatwayNumber } = require('./catwayService');
const { ErrorKind, ServiceError, fromMongooseError, assertObjectId } = require('./errors');

/**
 * Convertit une valeur en date valide.
 *
 * @param {*} value - Valeur reçue.
 * @param {string} label - Nom du champ, pour le message d'erreur.
 * @returns {Date} La date convertie.
 * @throws {ServiceError} Si la date est absente ou invalide.
 */
function parseDate(value, label) {
  const date = value instanceof Date ? value : new Date(String(value ?? ''));
  if (!value || Number.isNaN(date.getTime())) {
    throw new ServiceError(ErrorKind.VALIDATION, `La date « ${label} » est absente ou invalide.`);
  }
  return date;
}

/**
 * Liste les réservations, toutes ou celles d'un catway.
 *
 * @param {number|string} [catwayNumber] - Numéro du catway ; si absent, toutes les réservations.
 * @returns {Promise<Array<Object>>} Les réservations, triées par date de début.
 * @throws {ServiceError} NOT_FOUND si le catway demandé n'existe pas.
 */
async function listReservations(catwayNumber) {
  const filter = {};
  if (catwayNumber !== undefined) {
    filter.catwayNumber = (await getCatway(catwayNumber)).catwayNumber;
  }
  return Reservation.find(filter).sort({ checkIn: 1, catwayNumber: 1 }).lean();
}

/**
 * Récupère une réservation d'un catway.
 *
 * @param {number|string} catwayNumber - Numéro du catway.
 * @param {string} reservationId - Identifiant de la réservation.
 * @returns {Promise<Object>} La réservation trouvée.
 * @throws {ServiceError} NOT_FOUND si la réservation n'existe pas pour ce catway.
 */
async function getReservation(catwayNumber, reservationId) {
  const number = parseCatwayNumber(catwayNumber);
  assertObjectId(reservationId, 'de la réservation');
  const reservation = await Reservation.findOne({ _id: reservationId, catwayNumber: number }).lean();
  if (!reservation) {
    throw new ServiceError(
      ErrorKind.NOT_FOUND,
      `Aucune réservation ${reservationId} sur le catway n°${number}.`
    );
  }
  return reservation;
}

/**
 * Enregistre une réservation sur un catway existant,
 * à condition qu'elle ne chevauche pas une réservation existante.
 *
 * @param {number|string} catwayNumber - Numéro du catway réservé.
 * @param {{clientName: string, boatName: string, checkIn: (string|Date), checkOut: (string|Date)}} data - Données de la réservation.
 * @returns {Promise<Object>} La réservation créée.
 * @throws {ServiceError} VALIDATION, NOT_FOUND (catway inconnu) ou CONFLICT (créneau déjà pris).
 */
async function createReservation(catwayNumber, data = {}) {
  const catway = await getCatway(catwayNumber);
  const checkIn = parseDate(data.checkIn, 'checkIn');
  const checkOut = parseDate(data.checkOut, 'checkOut');
  if (checkOut <= checkIn) {
    throw new ServiceError(
      ErrorKind.VALIDATION,
      'La date de fin doit être postérieure à la date de début.'
    );
  }

  // Les opérateurs écrits ici sont déclarés de confiance, car l'option
  // sanitizeFilter neutralise par défaut tout opérateur dans un filtre.
  const overlap = await Reservation.findOne({
    catwayNumber: catway.catwayNumber,
    checkIn: mongoose.trusted({ $lt: checkOut }),
    checkOut: mongoose.trusted({ $gt: checkIn }),
  }).lean();
  if (overlap) {
    throw new ServiceError(
      ErrorKind.CONFLICT,
      `Le catway n°${catway.catwayNumber} est déjà réservé sur cette période (bateau « ${overlap.boatName} »).`
    );
  }

  try {
    const reservation = await Reservation.create({
      catwayNumber: catway.catwayNumber,
      clientName: data.clientName === undefined ? undefined : String(data.clientName),
      boatName: data.boatName === undefined ? undefined : String(data.boatName),
      checkIn,
      checkOut,
    });
    return reservation.toObject();
  } catch (error) {
    throw fromMongooseError(error);
  }
}

/**
 * Supprime une réservation d'un catway.
 *
 * @param {number|string} catwayNumber - Numéro du catway.
 * @param {string} reservationId - Identifiant de la réservation.
 * @returns {Promise<Object>} La réservation supprimée.
 * @throws {ServiceError} NOT_FOUND si la réservation n'existe pas pour ce catway.
 */
async function deleteReservation(catwayNumber, reservationId) {
  const reservation = await getReservation(catwayNumber, reservationId);
  await Reservation.deleteOne({ _id: reservation._id });
  return reservation;
}

module.exports = {
  listReservations,
  getReservation,
  createReservation,
  deleteReservation,
};
