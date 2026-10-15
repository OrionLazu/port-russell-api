/**
 * @file Contrôleur de connexion et de déconnexion.
 * @module controllers/authController
 */

const userService = require('../services/userService');
const { TOKEN_COOKIE } = require('../middlewares/auth');
const { ServiceError } = require('../services/errors');

/**
 * Options du cookie de session : inaccessible au JavaScript de la page,
 * envoyé uniquement en HTTPS en production, valable 24 heures.
 * @type {express.CookieOptions}
 */
const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  maxAge: 24 * 60 * 60 * 1000,
};

/**
 * POST /login — connexion.
 * Depuis le formulaire de l'accueil : dépose le cookie et redirige vers le tableau de bord.
 * Depuis un client d'API (JSON) : renvoie aussi le jeton dans la réponse.
 *
 * @param {express.Request} req - Requête Express.
 * @param {express.Response} res - Réponse Express.
 */
async function login(req, res) {
  const fromForm = req.is('application/x-www-form-urlencoded');
  try {
    const { token, user } = await userService.authenticate(req.body.email, req.body.password);
    res.cookie(TOKEN_COOKIE, token, COOKIE_OPTIONS);
    if (fromForm) {
      return res.redirect('/tableau-de-bord');
    }
    res.json({ message: 'Connexion réussie.', token, user });
  } catch (error) {
    if (fromForm && error instanceof ServiceError) {
      return res.status(401).render('index', {
        title: 'Accueil',
        error: error.message,
        email: typeof req.body.email === 'string' ? req.body.email : '',
      });
    }
    throw error;
  }
}

/**
 * GET /logout — déconnexion : supprime le cookie et revient à l'accueil.
 *
 * @param {express.Request} req - Requête Express.
 * @param {express.Response} res - Réponse Express.
 */
function logout(req, res) {
  res.clearCookie(TOKEN_COOKIE, { httpOnly: true, sameSite: 'lax', secure: COOKIE_OPTIONS.secure });
  res.format({
    json: () => res.json({ message: 'Déconnexion réussie.' }),
    html: () => res.redirect('/?deconnexion=1'),
  });
}

module.exports = { COOKIE_OPTIONS, login, logout };
