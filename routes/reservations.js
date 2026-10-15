/**
 * @file Routes de la sous-ressource réservations (toutes privées).
 * Montées sous /catways/:id/reservations, elles héritent du paramètre :id.
 * @module routes/reservations
 */

const { Router } = require('express');
const controller = require('../controllers/reservationController');
const { requireAuth } = require('../middlewares/auth');

const router = Router({ mergeParams: true });

router.use(requireAuth);

router.get('/', controller.list);
router.post('/', controller.create);
router.get('/:idReservation', controller.show);
router.delete('/:idReservation', controller.remove);

module.exports = router;
