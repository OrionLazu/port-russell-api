/**
 * @file Routes de la ressource users (toutes privées).
 * @module routes/users
 */

const { Router } = require('express');
const controller = require('../controllers/userController');
const { requireAuth } = require('../middlewares/auth');

const router = Router();

router.use(requireAuth);

router.get('/', controller.list);
router.post('/', controller.create);
router.get('/:id', controller.show);
router.put('/:id', controller.update);
router.patch('/:id', controller.update);
router.delete('/:id', controller.remove);

module.exports = router;
