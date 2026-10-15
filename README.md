# API du port de plaisance Russell

API REST privée de gestion des **catways** (petits appontements) et de leurs **réservations**
pour la capitainerie du port de plaisance Russell.

- **Application en ligne :** _lien ajouté après le déploiement_
- **Documentation de l'API :** page `/documentation` de l'application
- **Documentation technique (JSDoc) :** page `/jsdoc/index.html` de l'application

## Fonctionnalités

| N° | Fonctionnalité | Route |
| -- | -------------- | ----- |
| 1 | Créer un catway | `POST /catways` |
| 2 | Lister l'ensemble des catways | `GET /catways` |
| 3 | Récupérer les détails d'un catway | `GET /catways/:id` |
| 4 | Modifier la description de l'état d'un catway | `PATCH /catways/:id` (ou `PUT` pour tout remplacer) |
| 5 | Supprimer un catway | `DELETE /catways/:id` |
| 6 | Prendre la réservation d'un catway | `POST /catways/:id/reservations` |
| 7 | Supprimer une réservation | `DELETE /catways/:id/reservations/:idReservation` |
| 8 | Lister l'ensemble des réservations | `GET /catways/:id/reservations` |
| 9 | Afficher les détails d'une réservation | `GET /catways/:id/reservations/:idReservation` |

S'y ajoutent la connexion (`POST /login`, `GET /logout`) et la gestion des utilisateurs
(`GET`, `POST /users`, `GET`, `PUT`, `DELETE /users/:id`). Toutes les routes de données sont
protégées par un middleware d'authentification (jeton JWT dans un cookie `httpOnly`
ou dans l'en-tête `Authorization: Bearer`).

Le paramètre `:id` d'un catway est son numéro (`catwayNumber`).

## Pages

| Route | Page |
| ----- | ---- |
| `/` | Accueil : présentation, formulaire de connexion, lien vers la documentation |
| `/tableau-de-bord` | Tableau de bord : formulaires utilisateurs, catways et réservations |
| `/catways` | Liste des catways |
| `/catways/:id` | Détails d'un catway et de ses réservations |
| `/reservations` | Liste des réservations |
| `/catways/:id/reservations/:idReservation` | Détails d'une réservation |
| `/documentation` | Documentation de l'API (vue d'ensemble, tutoriel, exemples, glossaire) |

Les routes `/catways…` répondent en HTML à un navigateur et en JSON à un client d'API
(négociation de contenu sur l'en-tête `Accept`).

## Technologies

Node.js 22+, Express 5, MongoDB avec Mongoose, EJS, JSON Web Token, bcrypt,
Mocha et Supertest pour les tests, JSDoc pour la documentation du code.

## Organisation du code

```
├── app.js               Application Express (middlewares, routes)
├── server.js            Démarrage : MongoDB, serveur HTTP, puis tests
├── config/              Connexion à MongoDB
├── models/              Modèles Mongoose : Catway, Reservation, User
├── services/            Logique métier (aucun req, res ni code HTTP)
├── controllers/         Traduction HTTP ↔ services
├── routes/              Déclaration des routes
├── middlewares/         Authentification et gestion des erreurs
├── views/               Pages EJS
├── public/              CSS, JavaScript du tableau de bord, icône
├── tests/               Tests Mocha
├── docs/                Documentation JSDoc générée
├── scripts/seed.js      Import des données de départ
└── data/                catways.json et reservations.json fournis
```

Les services ne reçoivent jamais les objets `req` et `res` et ne manipulent aucun code
d'état HTTP : ils lèvent des erreurs métier (`VALIDATION`, `NOT_FOUND`, `CONFLICT`…)
que le middleware `errorHandler` traduit en codes HTTP.

## Installation en local

Prérequis : Node.js 22 ou plus et une base MongoDB (Atlas ou locale).

```bash
git clone https://github.com/OrionLazu/port-russell-api.git
cd port-russell-api
npm install
cp .env.example .env      # puis compléter les valeurs
npm run seed              # importe les catways, les réservations et crée le compte
npm start
```

L'application est alors disponible sur http://localhost:3000.

### Variables d'environnement

| Variable | Rôle |
| -------- | ---- |
| `MONGODB_URI` | Chaîne de connexion à la base de l'application |
| `MONGODB_URI_TEST` | Base dédiée aux tests (facultatif : sinon base en mémoire) |
| `JWT_SECRET` | Secret de signature des jetons |
| `JWT_EXPIRES_IN` | Durée de validité du jeton (par défaut `24h`) |
| `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Compte créé par `npm run seed` |
| `RUN_TESTS_ON_START` | `false` pour ne pas lancer les tests au démarrage |
| `PORT` | Port d'écoute (3000 par défaut) |

## Tests

```bash
npm test
```

Les tests s'exécutent aussi **automatiquement au lancement de l'application** (`npm start`) :
leurs résultats s'affichent dans la console du serveur. Ils utilisent une base séparée,
jamais la base de l'application.

- `tests/catways.test.js` : fonctionnalités 1 à 5
- `tests/reservations.test.js` : fonctionnalités 6 à 9
- `tests/users.test.js` : utilisateurs et authentification
- `tests/api.test.js` : routes HTTP, middleware d'authentification, parcours complet

## Documentation du code

```bash
npm run docs
```

Génère la documentation JSDoc dans `docs/jsdoc`, servie par l'application sur `/jsdoc`.

## Déploiement

L'application est déployée sur [Render](https://render.com) à partir du fichier `render.yaml`
(service web Node.js, déploiement automatique à chaque fusion sur `main`) et utilise
une base MongoDB Atlas. Au démarrage, le serveur se connecte à MongoDB puis lance les tests,
visibles dans les journaux de Render.

## Auteur

Mohamed IDJEDAINI — devoir CEF « Créer une API pour le port de plaisance Russell ».
