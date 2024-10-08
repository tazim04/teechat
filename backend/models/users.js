import mongoose from "mongoose";
import bcrypt from "bcrypt";
const SALT_WORK_FACTOR = 10;

// Schema for Users collection
const userSchema = new mongoose.Schema({
  email: { type: String, required: true },
  username: {
    type: String,
    required: true,
    unique: true, // Username must be unique
  },
  rooms: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room", // Reference to Room model for population
    },
  ], // Reference to the rooms the user is in
  password: { type: String, required: true },
  palette: { type: String, default: "default" },
  birthday: { type: Date, required: true },
  interests: [{ type: String }],
  socials: {
    facebook: { type: String },
    instagram: { type: String },
    linkedin: { type: String },
  }, // Social media fields
});

// runs on every save in the db, for hashing passwords
userSchema.pre("save", async function (next) {
  const user = this;

  // only hash the password if it has been modified OR is new
  if (!user.isModified("password")) return next();

  try {
    // generate a salt
    const salt = await bcrypt.genSalt(SALT_WORK_FACTOR);

    // hash the password using the salt
    const hash = await bcrypt.hash(user.password, salt);

    // override the cleartext password with the hashed one
    user.password = hash;
    next();
  } catch (e) {
    console.log(
      "(user.js) There was an error when trying to hash the user's password"
    );
    next(e);
  }
});

// method to compare candidate password with the hashed password
userSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    console.log("comparePassword:", candidatePassword);
    const isMatch = await bcrypt.compare(candidatePassword, this.password);
    return isMatch;
  } catch (err) {
    throw err;
  }
};

// Index on username for faster lookups
userSchema.index({ username: 1 });

const User = mongoose.model("User", userSchema); // Create a model from the schema

export default User;
