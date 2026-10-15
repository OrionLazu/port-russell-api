/**
 * @file Gestion des erreurs : traduit les erreurs métier en réponses HTTP.
 * @module middlewares/errorHandler
 */

const { ErrorKind, ServiceError, fromMongooseError } = require('../services/errors');

/**
 * Correspondance entre type d'erreur métier et code d'état HTTP.
 * C'est la seule couche de l'application qui connaît les codes HTTP.
 * @type {Object<string, number>}
 */
const STATUS_BY_KIND = {
  [ErrorKind.VALIDATION]: 400,
  [ErrorKind.UNAUTHENTICATED]: 401,
  [ErrorKind.FORBIDDEN]: 403,
  [ErrorKind.NOT_FOUND]: 404,
  [ErrorKind.CONFLICT]: 409,
};

/**
 * Répond 404 pour toute route inconnue.
 *
 * @param {express.Request} req - Requête Express.
 * @param {express.Response} res - Réponse Express.
 * @param {express.NextFunction} next - Middleware suivant.
 */
function notFound(req, res, next) {
  next(new ServiceError(ErrorKind.NOT_FOUND, `La ressource ${req.originalUrl} n'existe pas.`));
}

/**
 * Middleware final de gestion des erreurs : renvoie du JSON aux clients
 * de l'API et une page d'erreur aux navigateurs.
 *
 * @param {Error} err - Erreur levée.
 * @param {express.Request} req - Requête Express.
 * @param {express.Response} res - Réponse Express.
 * @param {express.NextFunction} _next - Middleware suivant (inutilisé).
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, _next) {
  let error = fromMongooseError(err);

  // Corps JSON mal formé envoyé par le client.
  if (error.type === 'entity.parse.failed') {
    error = new ServiceError(ErrorKind.VALIDATION, "Le corps de la requête n'est pas un JSON valide.");
  }

  const isServiceError = error instanceof ServiceError;
  const status = isServiceError ? STATUS_BY_KIND[error.kind] || 400 : 500;
  const message = isServiceError ? error.message : 'Une erreur interne est survenue.';

  if (status === 500 && process.env.NODE_ENV !== 'test') {
    console.error(error);
  }

  res.status(status);
  res.format({
    json: () => res.json({ error: message, details: error.details || [] }),
    html: () => res.render('error', { title: `Erreur ${status}`, status, message }),
    default: () => res.type('txt').send(message),
  });
}

module.exports = { STATUS_BY_KIND, notFound, errorHandler };
