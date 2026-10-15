/**
 * @file Tests unitaires du service des utilisateurs et de l'authentification.
 */

const assert = require('node:assert/strict');
const userService = require('../services/userService');
const User = require('../models/User');
const { ErrorKind } = require('../services/errors');

/**
 * Vérifie qu'une promesse échoue avec le type d'erreur métier attendu.
 *
 * @param {Promise} promise - Promesse à tester.
 * @param {string} kind - Type d'erreur attendu.
 */
async function rejectsWith(promise, kind) {
  await assert.rejects(promise, (error) => error.kind === kind);
}

const agent = { name: 'Agent', email: 'Agent@Port-Russell.fr', password: 'motdepasse' };

describe('Utilisateurs', () => {
  describe('Création', () => {
    it('crée un utilisateur sans renvoyer son mot de passe', async () => {
      const user = await userService.createUser(agent);
      assert.equal(user.email, 'agent@port-russell.fr');
      assert.equal(user.password, undefined);
    });

    it('stocke le mot de passe haché', async () => {
      await userService.createUser(agent);
      const stored = await User.findOne({ email: 'agent@port-russell.fr' }).select('+password').lean();
      assert.notEqual(stored.password, agent.password);
      assert.match(stored.password, /^\$2[aby]\$/);
    });

    it('refuse un e-mail déjà utilisé', async () => {
      await userService.createUser(agent);
      await rejectsWith(userService.createUser(agent), ErrorKind.CONFLICT);
    });

    it('refuse un mot de passe trop court', async () => {
      await rejectsWith(userService.createUser({ ...agent, password: 'court' }), ErrorKind.VALIDATION);
    });
  });

  describe('Modification et suppression', () => {
    it('modifie le nom d’un utilisateur', async () => {
      const user = await userService.createUser(agent);
      const updated = await userService.updateUser(String(user._id), { name: 'Agent principal' });
      assert.equal(updated.name, 'Agent principal');
    });

    it('supprime un utilisateur', async () => {
      const admin = await userService.createUser({ ...agent, email: 'admin@port-russell.fr' });
      const user = await userService.createUser(agent);
      await userService.deleteUser(String(user._id), String(admin._id));
      await rejectsWith(userService.getUser(String(user._id)), ErrorKind.NOT_FOUND);
    });

    it('interdit de supprimer son propre compte', async () => {
      const user = await userService.createUser(agent);
      await rejectsWith(userService.deleteUser(String(user._id), String(user._id)), ErrorKind.FORBIDDEN);
    });
  });

  describe('Authentification', () => {
    it('délivre un jeton valide avec les bons identifiants', async () => {
      await userService.createUser(agent);
      const { token, user } = await userService.authenticate('agent@port-russell.fr', 'motdepasse');
      assert.ok(token);
      const verified = await userService.verifyToken(token);
      assert.equal(String(verified._id), String(user._id));
    });

    it('refuse un mauvais mot de passe', async () => {
      await userService.createUser(agent);
      await rejectsWith(userService.authenticate('agent@port-russell.fr', 'mauvais'), ErrorKind.UNAUTHENTICATED);
    });

    it('refuse un jeton falsifié', async () => {
      await rejectsWith(userService.verifyToken('jeton.invalide.signature'), ErrorKind.UNAUTHENTICATED);
    });
  });
});
