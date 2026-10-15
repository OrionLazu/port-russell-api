/**
 * @file Tests des routes HTTP : authentification et routes privées.
 */

const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../app');
const userService = require('../services/userService');
const catwayService = require('../services/catwayService');

const credentials = { email: 'capitainerie@port-russell.fr', password: 'motdepasse' };

/**
 * Crée un utilisateur et renvoie un agent supertest connecté (cookie conservé).
 *
 * @returns {Promise<Object>} Agent connecté.
 */
async function loggedAgent() {
  await userService.createUser({ name: 'Capitainerie', ...credentials });
  const agent = request.agent(app);
  await agent.post('/login').send(credentials).expect(200);
  return agent;
}

describe('API HTTP', () => {
  describe('Pages publiques', () => {
    it('GET / affiche la page d’accueil avec le formulaire de connexion', async () => {
      const res = await request(app).get('/').expect(200);
      assert.match(res.text, /<form method="post" action="\/login"/);
      assert.match(res.text, /href="\/documentation"/);
    });

  });

  describe('Middleware d’authentification', () => {
    const privateRoutes = [
      ['get', '/catways'],
      ['post', '/catways'],
      ['delete', '/catways/1'],
      ['get', '/catways/1/reservations'],
      ['post', '/catways/1/reservations'],
      ['delete', '/catways/1/reservations/64b7f0c2a1b2c3d4e5f60718'],
      ['get', '/users'],
      ['post', '/users'],
      ['delete', '/users/64b7f0c2a1b2c3d4e5f60718'],
    ];

    privateRoutes.forEach(([method, url]) => {
      it(`${method.toUpperCase()} ${url} répond 401 sans connexion`, async () => {
        await request(app)[method](url).set('Accept', 'application/json').expect(401);
      });
    });

    it('redirige un navigateur non connecté vers l’accueil', async () => {
      const res = await request(app).get('/tableau-de-bord').set('Accept', 'text/html').expect(302);
      assert.equal(res.headers.location, '/?erreur=session');
    });
  });

  describe('Connexion', () => {
    it('le formulaire redirige vers le tableau de bord et dépose un cookie httpOnly', async () => {
      await userService.createUser({ name: 'Capitainerie', ...credentials });
      const res = await request(app).post('/login').type('form').send(credentials).expect(302);
      assert.equal(res.headers.location, '/tableau-de-bord');
      assert.match(res.headers['set-cookie'][0], /token=.+HttpOnly/);
    });

    it('refuse de mauvais identifiants', async () => {
      await request(app).post('/login').send({ email: 'x@y.fr', password: 'mauvais-mdp' }).expect(401);
    });

    it('garde l’utilisateur connecté d’une requête à l’autre grâce au cookie', async () => {
      const agent = await loggedAgent();
      await agent.get('/catways').set('Accept', 'application/json').expect(200);
      await agent.get('/users').set('Accept', 'application/json').expect(200);
      const res = await agent.get('/tableau-de-bord').set('Accept', 'text/html').expect(200);
      assert.match(res.text, /Tableau de bord/);
    });

    it('accepte aussi un jeton dans l’en-tête Authorization', async () => {
      await userService.createUser({ name: 'Capitainerie', ...credentials });
      const { body } = await request(app).post('/login').send(credentials).expect(200);
      await request(app).get('/catways').set('Authorization', `Bearer ${body.token}`).expect(200);
    });
  });

  describe('Parcours complet connecté', () => {
    it('crée, modifie, réserve puis supprime un catway', async () => {
      const agent = await loggedAgent();

      await agent.post('/catways').send({ catwayNumber: 12, type: 'long', catwayState: 'neuf' }).expect(201);
      const patched = await agent.patch('/catways/12').send({ catwayState: 'rayé' }).expect(200);
      assert.equal(patched.body.catwayState, 'rayé');

      const booked = await agent
        .post('/catways/12/reservations')
        .send({ clientName: 'Jack', boatName: 'Black Pearl', checkIn: '2026-07-01', checkOut: '2026-07-08' })
        .expect(201);
      await agent.get(`/catways/12/reservations/${booked.body._id}`).set('Accept', 'application/json').expect(200);
      // Alias au singulier du cahier des charges.
      await agent.get(`/catway/12/reservations/${booked.body._id}`).set('Accept', 'application/json').expect(200);

      await agent.delete(`/catways/12/reservations/${booked.body._id}`).expect(200);
      await agent.delete('/catways/12').expect(200);
      await agent.get('/catways/12').set('Accept', 'application/json').expect(404);
    });

    it('renvoie 400 avec des détails pour des données invalides', async () => {
      const agent = await loggedAgent();
      const res = await agent.post('/catways').send({ catwayNumber: 3, type: 'géant', catwayState: 'ok' }).expect(400);
      assert.ok(res.body.details.length > 0);
    });

    it('affiche les pages HTML des catways et des réservations', async () => {
      const agent = await loggedAgent();
      await catwayService.createCatway({ catwayNumber: 1, type: 'short', catwayState: 'bon état' });
      const list = await agent.get('/catways').set('Accept', 'text/html').expect(200);
      assert.match(list.text, /Liste des catways/);
      await agent.get('/catways/1').set('Accept', 'text/html').expect(200);
      await agent.get('/reservations').set('Accept', 'text/html').expect(200);
    });

    it('crée puis supprime un utilisateur via l’API', async () => {
      const agent = await loggedAgent();
      const created = await agent
        .post('/users')
        .send({ name: 'Agent', email: 'agent@port-russell.fr', password: 'motdepasse2' })
        .expect(201);
      assert.equal(created.body.password, undefined);
      await agent.delete(`/users/${created.body._id}`).expect(200);
    });
  });
});
