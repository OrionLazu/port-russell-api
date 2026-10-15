/**
 * @file Contrôleur des réservations (sous-ressource des catways).
 * @module controllers/reservationController
 */

const reservationService = require('../services/reservationService');

/**
 * GET /reservations — toutes les réservations du port (JSON ou page HTML).
 *
 * @param {express.Request} req - Requête Express.
 * @param {express.Response} res - Réponse Express.
 */
async function listAll(req, res) {
  const reservations = await reservationService.listReservations();
  res.format({
    json: () => res.json(reservations),
    html: () => res.render('reservations', { title: 'Réservations', reservations, catwayNumber: null }),
  });
}

/**
 * GET /catways/:id/reservations — réservations d'un catway (JSON ou page HTML).
 *
 * @param {express.Request} req - Requête Express.
 * @param {express.Response} res - Réponse Express.
 */
async function list(req, res) {
  const reservations = await reservationService.listReservations(req.params.id);
  res.format({
    json: () => res.json(reservations),
    html: () =>
      res.render('reservations', {
        title: `Réservations du catway n°${req.params.id}`,
        reservations,
        catwayNumber: req.params.id,
      }),
  });
}

/**
 * GET /catways/:id/reservations/:idReservation — détail d'une réservation.
 *
 * @param {express.Request} req - Requête Express.
 * @param {express.Response} res - Réponse Express.
 */
async function show(req, res) {
  const reservation = await reservationService.getReservation(req.params.id, req.params.idReservation);
  res.format({
    json: () => res.json(reservation),
    html: () => res.render('reservation', { title: 'Détail de la réservation', reservation }),
  });
}

/**
 * POST /catways/:id/reservations — prise d'une réservation.
 *
 * @param {express.Request} req - Requête Express.
 * @param {express.Response} res - Réponse Express.
 */
async function create(req, res) {
  const reservation = await reservationService.createReservation(req.params.id, req.body);
  res
    .status(201)
    .location(`/catways/${reservation.catwayNumber}/reservations/${reservation._id}`)
    .json(reservation);
}

/**
 * DELETE /catways/:id/reservations/:idReservation — suppression d'une réservation.
 *
 * @param {express.Request} req - Requête Express.
 * @param {express.Response} res - Réponse Express.
 */
async function remove(req, res) {
  const reservation = await reservationService.deleteReservation(req.params.id, req.params.idReservation);
  res.json({ message: 'Réservation supprimée.', reservation });
}

module.exports = { listAll, list, show, create, remove };
