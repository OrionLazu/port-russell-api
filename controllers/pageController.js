/**
 * @file Contrôleur des pages HTML (accueil, tableau de bord, documentation).
 * @module controllers/pageController
 */

const userService = require('../services/userService');
const catwayService = require('../services/catwayService');
const reservationService = require('../services/reservationService');
const { CATWAY_TYPES } = require('../models/Catway');

/** Messages affichés sur l'accueil selon le paramètre d'URL reçu. */
const HOME_MESSAGES = {
  session: { error: 'Votre session a expiré ou vous n’êtes pas connecté.' },
  deconnexion: { info: 'Vous êtes déconnecté. À bientôt !' },
};

/**
 * GET / — page d'accueil avec présentation et formulaire de connexion.
 * Un utilisateur déjà connecté est envoyé directement sur son tableau de bord.
 *
 * @param {express.Request} req - Requête Express.
 * @param {express.Response} res - Réponse Express.
 */
function home(req, res) {
  if (req.user) {
    return res.redirect('/tableau-de-bord');
  }
  let message = {};
  if (req.query.erreur === 'session') message = HOME_MESSAGES.session;
  else if (req.query.deconnexion) message = HOME_MESSAGES.deconnexion;
  res.render('index', { title: 'Accueil', email: '', ...message });
}

/**
 * GET /tableau-de-bord — tableau de bord de l'utilisateur connecté.
 *
 * @param {express.Request} req - Requête Express.
 * @param {express.Response} res - Réponse Express.
 */
async function dashboard(req, res) {
  const [users, catways, reservations] = await Promise.all([
    userService.listUsers(),
    catwayService.listCatways(),
    reservationService.listReservations(),
  ]);
  const now = new Date();
  const current = reservations.filter((r) => r.checkIn <= now && r.checkOut >= now);
  res.render('dashboard', {
    title: 'Tableau de bord',
    users,
    catways,
    catwayTypes: CATWAY_TYPES,
    stats: {
      catways: catways.length,
      reservations: reservations.length,
      current: current.length,
      free: catways.length - new Set(current.map((r) => r.catwayNumber)).size,
    },
  });
}

/**
 * GET /recherche/catway — formulaire « détails d'un catway » du tableau de bord.
 *
 * @param {express.Request} req - Requête Express.
 * @param {express.Response} res - Réponse Express.
 */
function findCatway(req, res) {
  const number = catwayService.parseCatwayNumber(req.query.catwayNumber);
  res.redirect(`/catways/${number}`);
}

/**
 * GET /recherche/reservation — formulaire « détails d'une réservation » du tableau de bord.
 *
 * @param {express.Request} req - Requête Express.
 * @param {express.Response} res - Réponse Express.
 */
function findReservation(req, res) {
  const number = catwayService.parseCatwayNumber(req.query.catwayNumber);
  const id = encodeURIComponent(String(req.query.idReservation || '').trim());
  res.redirect(`/catways/${number}/reservations/${id}`);
}

/**
 * GET /documentation — documentation de l'API.
 *
 * @param {express.Request} req - Requête Express.
 * @param {express.Response} res - Réponse Express.
 */
function documentation(req, res) {
  res.render('documentation', {
    title: "Documentation de l'API",
    baseUrl: `${req.protocol}://${req.get('host')}`,
  });
}

module.exports = { home, dashboard, findCatway, findReservation, documentation };
