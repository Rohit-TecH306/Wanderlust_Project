const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const passportLocalMongoose = require("passport-local-mongoose").default;

const userSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  activeSessionId: {
    type: String,
    default: null,
  },
  hostOnboardingCompleted: {
    type: Boolean,
    default: false,
  },
  hostFullName: {
    type: String,
    trim: true,
  },
  hostPhone: {
    type: String,
    trim: true,
  },
  hostCity: {
    type: String,
    trim: true,
  },
  hostPropertyType: {
    type: String,
    enum: ["entire_place", "private_room", "shared_room", "other"],
  },
  hostTermsAccepted: {
    type: Boolean,
    default: false,
  },
  hostTermsAcceptedAt: {
    type: Date,
  },
});

// passport-local-mongoose automatically adds username, hash, and salt fields.
// Therefore, do not add a plain-text password field to this schema.
userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", userSchema);
