const mongoose = require("mongoose");
const Joi = require("joi");
JoiObjectId = require("joi-objectid")(Joi);

// Create Schema for User Model
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    maxlength: 255,
    unique: true,
  },
  name: {
    type: String,
    required: true,
    minlength: 5,
    maxlength: 255,
  },
  email: {
    type: String,
    unique: true,
    maxlength: 255,
    required: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 8,
    maxlength: 255,
  },
  roleType: {
    type: String,
    enum: ["interviewer", "candidate"],
    required: true,
  },
  resumeLink: {
    type: String,
    maxlength: 500,
  },
  interviews: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Interview",
    },
  ],
});

// Create User Model from the Schema
const User = mongoose.model("User", userSchema);

// Validate User Model
async function validateUser(user) {
  const schema = Joi.object({
    username: Joi.string().required().max(255),
    name: Joi.string().required().min(5).max(255),
    email: Joi.string().max(255).required().email(),
    password: Joi.string().required().min(8).max(255),
    roleType: Joi.string().valid("interviewer", "candidate").required(),
    resumeLink: Joi.string().max(500),
    interviews: Joi.array().items(JoiObjectId()),
  });

  return schema.validate(user);
}

// Export User Model
module.exports.User = User;
module.exports.validate = validateUser;
