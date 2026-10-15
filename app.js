/**
 * @file Construction de l'application Express (sans démarrage du serveur),
 * afin de pouvoir l'utiliser aussi bien en production que dans les tests.
 * @module app
 */

const path = require('path');
const express = require('express');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');

const pageRoutes = require('./routes/pages');
const catwayRoutes = require('./routes/catways');
const reservationRoutes = require('./routes/reservations');
const userRoutes = require('./routes/users');
const { notFound, errorHandler } = require('./middlewares/errorHandler');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('trust proxy', 1);
app.disable('x-powered-by');

/**
 * Formate une date pour l'affichage (fuseau de Paris).
 *
 * @param {Date|string} value - Date à formater.
 * @param {boolean} [withTime=false] - Ajouter l'heure.
 * @returns {string} La date au format français.
 */
app.locals.formatDate = (value, withTime = false) =>
  new Date(value).toLocaleString('fr-FR', {
    timeZone: 'Europe/Paris',
    dateStyle: 'long',
    ...(withTime ? { timeStyle: 'short' } : {}),
  });

app.use(helmet());
app.use(express.json({ limit: '20kb' }));
app.use(express.urlencoded({ extended: false, limit: '20kb' }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
// Documentation technique générée par JSDoc (npm run docs).
app.use('/jsdoc', express.static(path.join(__dirname, 'docs', 'jsdoc')));

// Variables disponibles dans toutes les vues.
app.use((req, res, next) => {
  res.locals.currentUser = null;
  res.locals.currentPath = req.path;
  next();
});

app.use('/', pageRoutes);
app.use('/catways', catwayRoutes);
// Alias au singulier, tel qu'écrit dans le cahier des charges.
app.use('/catway/:id/reservations', reservationRoutes);
app.use('/users', userRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
