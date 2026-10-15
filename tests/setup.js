/**
 * @file Préparation des tests : base MongoDB dédiée, isolée des vraies données.
 *
 * - Si MONGODB_URI_TEST est défini (en production, sur Render), les tests
 *   utilisent cette base de test, distincte de la base de l'application.
 * - Sinon (en local), une base MongoDB en mémoire est démarrée.
 *
 * Chargé par Mocha avant les fichiers de test (voir .mocharc.json).
 * @module tests/setup
 */

const mongoose = require('mongoose');
const { connectDatabase, disconnectDatabase } = require('../config/db');

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'secret-de-test';

let mongod;

/**
 * Renvoie l'URI de la base de test, en démarrant au besoin une base en mémoire.
 *
 * @returns {Promise<string>} URI de la base de test.
 */
async function testDatabaseUri() {
  const uri = process.env.MONGODB_URI_TEST;
  if (uri) {
    if (uri === process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI_TEST doit désigner une autre base que MONGODB_URI.');
    }
    return uri;
  }
  const { MongoMemoryServer } = require('mongodb-memory-server');
  mongod = await MongoMemoryServer.create();
  return mongod.getUri('port-russell-test');
}

exports.mochaHooks = {
  async beforeAll() {
    await connectDatabase(await testDatabaseUri());
    // Crée les index (unicité) avant de lancer les tests.
    await Promise.all(Object.values(mongoose.models).map((model) => model.init()));
  },

  async beforeEach() {
    const collections = Object.values(mongoose.connection.collections);
    await Promise.all(collections.map((collection) => collection.deleteMany({})));
  },

  async afterAll() {
    await disconnectDatabase();
    if (mongod) await mongod.stop();
  },
};
