// ============================================================
//  models/User.js — User data model + password security
//  ============================================================
//  Defines the "user" schema and, importantly, HOW we handle
//  passwords securely.
//
//  LEARNING NOTE — Hashing vs Encryption:
//  - We NEVER store plaintext passwords. If the DB leaks, plaintext
//    passwords would expose every account.
//  - HASHING (bcrypt) turns a password into a fixed-length,
//    one-way "fingerprint". You cannot reverse a hash back to the
//    password. To verify a login, you hash the entered password
//    and compare the hashes.
//  - bcrypt also uses a random "salt" per user, so identical
//    passwords produce different hashes — this defeats rainbow
//    table attacks.
// ============================================================

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },

    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true, // no two users may share an email
      lowercase: true, // store emails in lowercase to avoid "A@x.com" != "a@x.com"
      trim: true,
    },

    // password: `select: false` means this field is NOT included in
    // normal database queries. You must explicitly ask for it with
    // `.select('+password')` — protecting the hash from accidental
    // exposure in API responses.
    password: {
      type: String,
      required: [true, 'Password is required'],
      select: false, // hidden by default
      minlength: [6, 'Password must be at least 6 characters'],
    },

    isAdmin: {
      type: Boolean,
      default: false, // ordinary users are not admins by default
    },
  },
  { timestamps: true }
);

// ============================================================
//  Pre-save hook — hash the password BEFORE saving
//  ============================================================
//  "pre('save')" is a Mongoose middleware that runs right before a
//  user document is saved to the database. We use it to hash the
//  password automatically, so we never risk storing it in plaintext.
// ============================================================
userSchema.pre('save', async function (next) {
  // `this` is the user document being saved.
  // isModified('password') is true only if the password actually
  // changed. This avoids re-hashing an already-hashed password on
  // every save (e.g. when only the name changes).
  if (!this.isModified('password')) {
    return next();
  }

  // bcrypt.hash with a salt rounds factor of 10. Higher = more secure
  // but slower. 10 is a good balance for a learning project.
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ============================================================
//  Instance method — compare an entered password to the hash
//  ============================================================
//  `methods.matchPassword` becomes a method available on every User
//  document (e.g. `user.matchPassword(password)`). It compares the
//  plaintext a user typed at login against the stored hash.
//  bcrypt.compare does the heavy lifting (it re-applies the salt
//  and hashes, then compares). Returns true/false.
// ============================================================
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);

export default User;
