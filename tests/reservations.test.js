/**
 * @file Tests unitaires du service des réservations (fonctionnalités 6 à 9).
 */

const assert = require('node:assert/strict');
const catwayService = require('../services/catwayService');
const reservationService = require('../services/reservationService');
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

const booking = {
  clientName: 'Thomas Martin',
  boatName: 'Carolina',
  checkIn: '2026-05-21',
  checkOut: '2026-05-28',
};

describe('Réservations', () => {
  beforeEach(async () => {
    await catwayService.createCatway({ catwayNumber: 1, type: 'short', catwayState: 'bon état' });
    await catwayService.createCatway({ catwayNumber: 2, type: 'long', catwayState: 'bon état' });
  });

  describe('Fonctionnalité 6 — Prendre la réservation d’un catway', () => {
    it('enregistre une réservation sur un catway existant', async () => {
      const reservation = await reservationService.createReservation(1, booking);
      assert.equal(reservation.catwayNumber, 1);
      assert.equal(reservation.boatName, 'Carolina');
      assert.ok(reservation._id);
    });

    it('refuse une réservation sur un catway inexistant', async () => {
      await rejectsWith(reservationService.createReservation(50, booking), ErrorKind.NOT_FOUND);
    });

    it('refuse une date de départ antérieure à l’arrivée', async () => {
      await rejectsWith(
        reservationService.createReservation(1, { ...booking, checkIn: '2026-06-10', checkOut: '2026-06-01' }),
        ErrorKind.VALIDATION
      );
    });

    it('refuse une réservation qui chevauche une réservation existante', async () => {
      await reservationService.createReservation(1, booking);
      await rejectsWith(
        reservationService.createReservation(1, { ...booking, boatName: 'Autre', checkIn: '2026-05-25', checkOut: '2026-06-02' }),
        ErrorKind.CONFLICT
      );
    });

    it('accepte la même période sur un autre catway', async () => {
      await reservationService.createReservation(1, booking);
      const other = await reservationService.createReservation(2, booking);
      assert.equal(other.catwayNumber, 2);
    });

    it('refuse une réservation sans nom de bateau', async () => {
      await rejectsWith(
        reservationService.createReservation(1, { ...booking, boatName: undefined }),
        ErrorKind.VALIDATION
      );
    });
  });

  describe('Fonctionnalité 7 — Supprimer une réservation', () => {
    it('supprime la réservation demandée', async () => {
      const created = await reservationService.createReservation(1, booking);
      const deleted = await reservationService.deleteReservation(1, String(created._id));
      assert.equal(String(deleted._id), String(created._id));
      assert.deepEqual(await reservationService.listReservations(1), []);
    });

    it('refuse de supprimer une réservation via un autre catway', async () => {
      const created = await reservationService.createReservation(1, booking);
      await rejectsWith(reservationService.deleteReservation(2, String(created._id)), ErrorKind.NOT_FOUND);
    });

    it('refuse un identifiant mal formé', async () => {
      await rejectsWith(reservationService.deleteReservation(1, 'abc'), ErrorKind.VALIDATION);
    });
  });

  describe('Fonctionnalité 8 — Lister l’ensemble des réservations', () => {
    it('liste les réservations d’un catway', async () => {
      await reservationService.createReservation(1, booking);
      await reservationService.createReservation(2, booking);
      const list = await reservationService.listReservations(1);
      assert.equal(list.length, 1);
      assert.equal(list[0].catwayNumber, 1);
    });

    it('liste toutes les réservations du port', async () => {
      await reservationService.createReservation(1, booking);
      await reservationService.createReservation(2, booking);
      assert.equal((await reservationService.listReservations()).length, 2);
    });

    it('signale un catway inexistant', async () => {
      await rejectsWith(reservationService.listReservations(42), ErrorKind.NOT_FOUND);
    });
  });

  describe('Fonctionnalité 9 — Afficher les détails d’une réservation', () => {
    it('renvoie la réservation demandée', async () => {
      const created = await reservationService.createReservation(2, booking);
      const reservation = await reservationService.getReservation(2, String(created._id));
      assert.equal(reservation.clientName, 'Thomas Martin');
      assert.equal(new Date(reservation.checkIn).toISOString().slice(0, 10), '2026-05-21');
    });

    it('signale une réservation inexistante', async () => {
      await rejectsWith(
        reservationService.getReservation(2, '64b7f0c2a1b2c3d4e5f60718'),
        ErrorKind.NOT_FOUND
      );
    });
  });
});
