/**
 * @file Middleware d'authentification : privatise les routes de l'API.
 * @module middlewares/auth
 */

const { verifyToken } = require('../services/userService');

/** Nom du cookie qui transporte le jeton JWT. */
const TOKEN_COOKIE = 'token';

/**
 * Extrait le jeton JWT de la requête : d'abord l'en-tête
 * `Authorization: Bearer <jeton>`, sinon le cookie de session.
 *
 * @param {express.Request} req - Requête Express.
 * @returns {string|undefined} Le jeton, s'il existe.
 */
function extractToken(req) {
  const header = req.get('Authorization') || '';
  if (header.startsWith('Bearer ')) {
    return header.slice(7).trim();
  }
  return req.cookies ? req.cookies[TOKEN_COOKIE] : undefined;
}

/**
 * Exige un utilisateur connecté. Le jeton est conservé dans un cookie
 * httpOnly : l'utilisateur n'a donc pas à se reconnecter à chaque requête.
 *
 * - Requête d'un navigateur (HTML) sans session valide : redirection vers l'accueil.
 * - Requête d'API (JSON) sans session valide : erreur 401 transmise au gestionnaire d'erreurs.
 *
 * @param {express.Request} req - Requête Express.
 * @param {express.Response} res - Réponse Express.
 * @param {express.NextFunction} next - Middleware suivant.
 * @returns {Promise<void>}
 */
async function requireAuth(req, res, next) {
  // Déjà vérifié par un routeur parent (ex. réservations sous /catways).
  if (req.user) return next();
  try {
    req.user = await verifyToken(extractToken(req));
    res.locals.currentUser = req.user;
    next();
  } catch (error) {
    res.clearCookie(TOKEN_COOKIE);
    if (req.method === 'GET' && req.accepts(['json', 'html']) === 'html') {
      return res.redirect('/?erreur=session');
    }
    next(error);
  }
}

/**
 * Renseigne l'utilisateur connecté s'il existe, sans bloquer la requête.
 * Utile pour les pages publiques (accueil, documentation).
 *
 * @param {express.Request} req - Requête Express.
 * @param {express.Response} res - Réponse Express.
 * @param {express.NextFunction} next - Middleware suivant.
 * @returns {Promise<void>}
 */
async function optionalAuth(req, res, next) {
  const token = extractToken(req);
  if (token) {
    try {
      req.user = await verifyToken(token);
      res.locals.currentUser = req.user;
    } catch {
      res.clearCookie(TOKEN_COOKIE);
    }
  }
  next();
}

module.exports = { TOKEN_COOKIE, extractToken, requireAuth, optionalAuth };
