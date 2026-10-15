/**
 * @file Tests unitaires du service des catways (fonctionnalités 1 à 5).
 */

const assert = require('node:assert/strict');
const catwayService = require('../services/catwayService');
const Reservation = require('../models/Reservation');
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

describe('Catways', () => {
  describe('Fonctionnalité 1 — Créer un catway', () => {
    it('crée un catway avec un numéro, un type et un état', async () => {
      const catway = await catwayService.createCatway({ catwayNumber: 1, type: 'long', catwayState: 'bon état' });
      assert.equal(catway.catwayNumber, 1);
      assert.equal(catway.type, 'long');
      assert.equal(catway.catwayState, 'bon état');
    });

    it('accepte un numéro envoyé sous forme de texte', async () => {
      const catway = await catwayService.createCatway({ catwayNumber: '7', type: 'short', catwayState: 'neuf' });
      assert.equal(catway.catwayNumber, 7);
    });

    it('refuse un numéro déjà utilisé', async () => {
      await catwayService.createCatway({ catwayNumber: 1, type: 'long', catwayState: 'bon état' });
      await rejectsWith(
        catwayService.createCatway({ catwayNumber: 1, type: 'short', catwayState: 'neuf' }),
        ErrorKind.CONFLICT
      );
    });

    it('refuse un type autre que « long » ou « short »', async () => {
      await rejectsWith(
        catwayService.createCatway({ catwayNumber: 2, type: 'moyen', catwayState: 'neuf' }),
        ErrorKind.VALIDATION
      );
    });

    it('refuse un numéro invalide', async () => {
      await rejectsWith(
        catwayService.createCatway({ catwayNumber: -3, type: 'long', catwayState: 'neuf' }),
        ErrorKind.VALIDATION
      );
    });
  });

  describe('Fonctionnalité 2 — Lister l’ensemble des catways', () => {
    it('renvoie tous les catways triés par numéro', async () => {
      await catwayService.createCatway({ catwayNumber: 3, type: 'long', catwayState: 'bon état' });
      await catwayService.createCatway({ catwayNumber: 1, type: 'short', catwayState: 'bon état' });
      const catways = await catwayService.listCatways();
      assert.deepEqual(catways.map((c) => c.catwayNumber), [1, 3]);
    });

    it('renvoie une liste vide quand il n’y a aucun catway', async () => {
      assert.deepEqual(await catwayService.listCatways(), []);
    });
  });

  describe('Fonctionnalité 3 — Récupérer les détails d’un catway', () => {
    it('renvoie le catway demandé', async () => {
      await catwayService.createCatway({ catwayNumber: 5, type: 'long', catwayState: 'peinture écaillée' });
      const catway = await catwayService.getCatway(5);
      assert.equal(catway.catwayState, 'peinture écaillée');
    });

    it('signale un catway inexistant', async () => {
      await rejectsWith(catwayService.getCatway(99), ErrorKind.NOT_FOUND);
    });
  });

  describe('Fonctionnalité 4 — Modifier la description de l’état d’un catway', () => {
    beforeEach(async () => {
      await catwayService.createCatway({ catwayNumber: 4, type: 'short', catwayState: 'bon état' });
    });

    it('modifie l’état avec PATCH sans toucher au type', async () => {
      const catway = await catwayService.updateCatway(4, { catwayState: 'planche cassée' });
      assert.equal(catway.catwayState, 'planche cassée');
      assert.equal(catway.type, 'short');
    });

    it('remplace tout le catway avec PUT', async () => {
      const catway = await catwayService.replaceCatway(4, { type: 'long', catwayState: 'rallongé' });
      assert.equal(catway.type, 'long');
      assert.equal(catway.catwayState, 'rallongé');
    });

    it('refuse un PUT incomplet', async () => {
      await rejectsWith(catwayService.replaceCatway(4, { catwayState: 'x' }), ErrorKind.VALIDATION);
    });

    it('refuse de changer le numéro du catway', async () => {
      await rejectsWith(
        catwayService.updateCatway(4, { catwayNumber: 8, catwayState: 'x' }),
        ErrorKind.VALIDATION
      );
    });

    it('signale un catway inexistant', async () => {
      await rejectsWith(catwayService.updateCatway(40, { catwayState: 'x' }), ErrorKind.NOT_FOUND);
    });
  });

  describe('Fonctionnalité 5 — Supprimer un catway', () => {
    it('supprime le catway et ses réservations', async () => {
      await catwayService.createCatway({ catwayNumber: 6, type: 'long', catwayState: 'bon état' });
      await Reservation.create({
        catwayNumber: 6,
        clientName: 'Jeanne',
        boatName: 'Mistral',
        checkIn: new Date('2026-06-01'),
        checkOut: new Date('2026-06-10'),
      });
      const result = await catwayService.deleteCatway(6);
      assert.equal(result.catway.catwayNumber, 6);
      assert.equal(result.deletedReservations, 1);
      await rejectsWith(catwayService.getCatway(6), ErrorKind.NOT_FOUND);
    });

    it('signale un catway inexistant', async () => {
      await rejectsWith(catwayService.deleteCatway(77), ErrorKind.NOT_FOUND);
    });
  });
});
