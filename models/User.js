/**
 * @file Modèle Mongoose d'un utilisateur de la capitainerie.
 * @module models/User
 */

const { Schema, model } = require('mongoose');

/**
 * @typedef {Object} User
 * @property {string} name - Nom de l'utilisateur.
 * @property {string} email - Adresse de messagerie unique.
 * @property {string} password - Mot de passe haché (jamais renvoyé par l'API).
 */
const userSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Le nom est obligatoire.'],
      trim: true,
      maxlength: [100, 'Le nom ne doit pas dépasser 100 caractères.'],
    },
    email: {
      type: String,
      required: [true, "L'adresse e-mail est obligatoire."],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "L'adresse e-mail n'est pas valide."],
    },
    password: {
      type: String,
      required: [true, 'Le mot de passe est obligatoire.'],
      select: false,
    },
  },
  { timestamps: true, versionKey: false }
);

// Le mot de passe haché ne sort jamais du modèle lors d'une conversion en JSON.
userSchema.set('toJSON', {
  transform(_doc, ret) {
    delete ret.password;
    return ret;
  },
});

module.exports = model('User', userSchema);
