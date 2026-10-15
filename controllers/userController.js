/**
 * @file Contrôleur des utilisateurs de la capitainerie.
 * @module controllers/userController
 */

const userService = require('../services/userService');

/**
 * GET /users — liste des utilisateurs.
 *
 * @param {express.Request} req - Requête Express.
 * @param {express.Response} res - Réponse Express.
 */
async function list(req, res) {
  res.json(await userService.listUsers());
}

/**
 * GET /users/:id — détail d'un utilisateur.
 *
 * @param {express.Request} req - Requête Express.
 * @param {express.Response} res - Réponse Express.
 */
async function show(req, res) {
  res.json(await userService.getUser(req.params.id));
}

/**
 * POST /users — création d'un utilisateur.
 *
 * @param {express.Request} req - Requête Express.
 * @param {express.Response} res - Réponse Express.
 */
async function create(req, res) {
  const user = await userService.createUser(req.body);
  res.status(201).location(`/users/${user._id}`).json(user);
}

/**
 * PUT /users/:id — modification d'un utilisateur.
 *
 * @param {express.Request} req - Requête Express.
 * @param {express.Response} res - Réponse Express.
 */
async function update(req, res) {
  res.json(await userService.updateUser(req.params.id, req.body));
}

/**
 * DELETE /users/:id — suppression d'un utilisateur.
 *
 * @param {express.Request} req - Requête Express.
 * @param {express.Response} res - Réponse Express.
 */
async function remove(req, res) {
  const user = await userService.deleteUser(req.params.id, req.user._id);
  res.json({ message: `Utilisateur ${user.email} supprimé.`, user });
}

module.exports = { list, show, create, update, remove };
