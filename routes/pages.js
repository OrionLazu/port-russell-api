/**
 * @file Routes des pages HTML et de l'authentification.
 * @module routes/pages
 */

const { Router } = require('express');
const rateLimit = require('express-rate-limit');
const pages = require('../controllers/pageController');
const auth = require('../controllers/authController');
const reservations = require('../controllers/reservationController');
const { requireAuth, optionalAuth } = require('../middlewares/auth');

const router = Router();

// Limite les tentatives de connexion pour freiner les attaques par force brute.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
  message: { error: 'Trop de tentatives de connexion, réessayez dans quelques minutes.' },
});

router.get('/', optionalAuth, pages.home);

router.post('/login', loginLimiter, auth.login);
router.get('/logout', auth.logout);

router.get('/tableau-de-bord', requireAuth, pages.dashboard);
router.get('/reservations', requireAuth, reservations.listAll);
router.get('/recherche/catway', requireAuth, pages.findCatway);
router.get('/recherche/reservation', requireAuth, pages.findReservation);

module.exports = router;
