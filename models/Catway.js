/**
 * @file Modèle Mongoose d'un catway (petit appontement).
 * @module models/Catway
 */

const { Schema, model } = require('mongoose');

/**
 * Types de catway acceptés.
 * @type {string[]}
 */
const CATWAY_TYPES = ['long', 'short'];

/**
 * @typedef {Object} Catway
 * @property {number} catwayNumber - Numéro unique du catway (entier positif).
 * @property {('long'|'short')} type - Longueur du catway.
 * @property {string} catwayState - Description de l'état du catway.
 */
const catwaySchema = new Schema(
  {
    catwayNumber: {
      type: Number,
      required: [true, 'Le numéro du catway est obligatoire.'],
      unique: true,
      min: [1, 'Le numéro du catway doit être supérieur à 0.'],
      validate: {
        validator: Number.isInteger,
        message: 'Le numéro du catway doit être un entier.',
      },
    },
    type: {
      type: String,
      required: [true, 'Le type du catway est obligatoire.'],
      enum: {
        values: CATWAY_TYPES,
        message: 'Le type doit valoir « long » ou « short ».',
      },
    },
    catwayState: {
      type: String,
      required: [true, "La description de l'état est obligatoire."],
      trim: true,
      maxlength: [500, "La description de l'état ne doit pas dépasser 500 caractères."],
    },
  },
  { timestamps: true, versionKey: false }
);

module.exports = model('Catway', catwaySchema);
module.exports.CATWAY_TYPES = CATWAY_TYPES;
