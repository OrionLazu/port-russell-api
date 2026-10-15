/**
 * @file Modèle Mongoose d'une réservation de catway.
 * @module models/Reservation
 */

const { Schema, model } = require('mongoose');

/**
 * @typedef {Object} Reservation
 * @property {number} catwayNumber - Numéro du catway réservé.
 * @property {string} clientName - Nom du client.
 * @property {string} boatName - Nom du bateau amarré.
 * @property {Date} checkIn - Date de début de la réservation.
 * @property {Date} checkOut - Date de fin de la réservation.
 */
const reservationSchema = new Schema(
  {
    catwayNumber: {
      type: Number,
      required: [true, 'Le numéro du catway est obligatoire.'],
      index: true,
    },
    clientName: {
      type: String,
      required: [true, 'Le nom du client est obligatoire.'],
      trim: true,
      maxlength: [100, 'Le nom du client ne doit pas dépasser 100 caractères.'],
    },
    boatName: {
      type: String,
      required: [true, 'Le nom du bateau est obligatoire.'],
      trim: true,
      maxlength: [100, 'Le nom du bateau ne doit pas dépasser 100 caractères.'],
    },
    checkIn: {
      type: Date,
      required: [true, 'La date de début est obligatoire.'],
    },
    checkOut: {
      type: Date,
      required: [true, 'La date de fin est obligatoire.'],
      validate: {
        validator(value) {
          return !this.checkIn || value > this.checkIn;
        },
        message: 'La date de fin doit être postérieure à la date de début.',
      },
    },
  },
  { timestamps: true, versionKey: false }
);

module.exports = model('Reservation', reservationSchema);
