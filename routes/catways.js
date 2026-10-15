/**
 * @file Routes de la ressource catways (toutes privées).
 * @module routes/catways
 */

const { Router } = require('express');
const controller = require('../controllers/catwayController');
const reservationRoutes = require('./reservations');
const { requireAuth } = require('../middlewares/auth');

const router = Router();

router.use(requireAuth);

router.get('/', controller.list);
router.post('/', controller.create);
router.get('/:id', controller.show);
router.put('/:id', controller.replace);
router.patch('/:id', controller.update);
router.delete('/:id', controller.remove);

// Sous-ressource : les réservations d'un catway.
router.use('/:id/reservations', reservationRoutes);

module.exports = router;
