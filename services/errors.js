/**
 * @file Erreurs métier levées par les services.
 *
 * Les services ne connaissent ni l'objet `req`, ni l'objet `res`, ni les codes
 * d'état HTTP : ils lèvent une {@link ServiceError} portant un type métier,
 * que le middleware de gestion d'erreurs traduit ensuite en réponse HTTP.
 * @module services/errors
 */

const mongoose = require('mongoose');

/**
 * Types d'erreur métier.
 * @readonly
 * @enum {string}
 */
const ErrorKind = Object.freeze({
  VALIDATION: 'VALIDATION',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  UNAUTHENTICATED: 'UNAUTHENTICATED',
  FORBIDDEN: 'FORBIDDEN',
});

/**
 * Erreur métier indépendante du protocole HTTP.
 * @extends Error
 */
class ServiceError extends Error {
  /**
   * @param {ErrorKind} kind - Type de l'erreur.
   * @param {string} message - Message lisible par l'utilisateur.
   * @param {string[]} [details] - Précisions éventuelles (champs invalides...).
   */
  constructor(kind, message, details = []) {
    super(message);
    this.name = 'ServiceError';
    this.kind = kind;
    this.details = details;
  }
}

/**
 * Convertit une erreur Mongoose connue en {@link ServiceError}.
 * Les autres erreurs sont renvoyées telles quelles.
 *
 * @param {Error} error - Erreur d'origine.
 * @returns {Error} Erreur métier ou erreur d'origine.
 */
function fromMongooseError(error) {
  if (error instanceof mongoose.Error.ValidationError) {
    const details = Object.values(error.errors).map((e) =>
      e instanceof mongoose.Error.CastError ? `Valeur invalide pour « ${e.path} ».` : e.message
    );
    return new ServiceError(ErrorKind.VALIDATION, 'Les données envoyées sont invalides.', details);
  }
  if (error instanceof mongoose.Error.CastError) {
    return new ServiceError(ErrorKind.VALIDATION, `Valeur invalide pour « ${error.path} ».`);
  }
  if (error && error.code === 11000) {
    const field = Object.keys(error.keyValue || {})[0] || 'champ';
    return new ServiceError(ErrorKind.CONFLICT, `La valeur du champ « ${field} » est déjà utilisée.`);
  }
  return error;
}

/**
 * Vérifie qu'un identifiant MongoDB est valide.
 *
 * @param {string} id - Identifiant à contrôler.
 * @param {string} label - Nom de la ressource, pour le message d'erreur.
 * @throws {ServiceError} Si l'identifiant est mal formé.
 */
function assertObjectId(id, label) {
  if (typeof id !== 'string' || !mongoose.isValidObjectId(id) || !/^[0-9a-f]{24}$/i.test(id)) {
    throw new ServiceError(ErrorKind.VALIDATION, `L'identifiant ${label} n'est pas valide.`);
  }
}

module.exports = { ErrorKind, ServiceError, fromMongooseError, assertObjectId };
