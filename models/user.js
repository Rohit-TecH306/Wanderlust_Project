const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const passportLocalMongoose = require("passport-local-mongoose").default;

const userSchema = new Schema({
  email: {
    type: String,
    required: true,
  },
});

// passport-local-mongoose automatically adds username, hash, and salt fields.
// Therefore, do not add a plain-text password field to this schema.
userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", userSchema);
