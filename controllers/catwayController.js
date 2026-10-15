/**
 * @file Contrôleur des catways : fait le lien entre HTTP et le service métier.
 * @module controllers/catwayController
 */

const catwayService = require('../services/catwayService');
const reservationService = require('../services/reservationService');

/**
 * GET /catways — liste des catways (JSON ou page HTML).
 *
 * @param {express.Request} req - Requête Express.
 * @param {express.Response} res - Réponse Express.
 */
async function list(req, res) {
  const catways = await catwayService.listCatways();
  res.format({
    json: () => res.json(catways),
    html: () => res.render('catways', { title: 'Catways', catways }),
  });
}

/**
 * GET /catways/:id — détail d'un catway (JSON ou page HTML avec ses réservations).
 *
 * @param {express.Request} req - Requête Express.
 * @param {express.Response} res - Réponse Express.
 */
async function show(req, res) {
  const catway = await catwayService.getCatway(req.params.id);
  if (req.accepts(['json', 'html']) !== 'html') {
    return res.json(catway);
  }
  const reservations = await reservationService.listReservations(catway.catwayNumber);
  res.render('catway', { title: `Catway n°${catway.catwayNumber}`, catway, reservations });
}

/**
 * POST /catways — création d'un catway.
 *
 * @param {express.Request} req - Requête Express.
 * @param {express.Response} res - Réponse Express.
 */
async function create(req, res) {
  const catway = await catwayService.createCatway(req.body);
  res.status(201).location(`/catways/${catway.catwayNumber}`).json(catway);
}

/**
 * PUT /catways/:id — remplacement complet d'un catway.
 *
 * @param {express.Request} req - Requête Express.
 * @param {express.Response} res - Réponse Express.
 */
async function replace(req, res) {
  res.json(await catwayService.replaceCatway(req.params.id, req.body));
}

/**
 * PATCH /catways/:id — modification partielle (description de l'état).
 *
 * @param {express.Request} req - Requête Express.
 * @param {express.Response} res - Réponse Express.
 */
async function update(req, res) {
  res.json(await catwayService.updateCatway(req.params.id, req.body));
}

/**
 * DELETE /catways/:id — suppression d'un catway et de ses réservations.
 *
 * @param {express.Request} req - Requête Express.
 * @param {express.Response} res - Réponse Express.
 */
async function remove(req, res) {
  const { catway, deletedReservations } = await catwayService.deleteCatway(req.params.id);
  res.json({
    message: `Catway n°${catway.catwayNumber} supprimé.`,
    catway,
    deletedReservations,
  });
}

module.exports = { list, show, create, replace, update, remove };
