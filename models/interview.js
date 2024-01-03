const mongoose = require("mongoose");
const Joi = require("joi");
JoiObjectId = require("joi-objectid")(Joi);

// Create Schema for Interview Model
const interviewSchema = new mongoose.Schema({
  interviewers: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      validate: {
        validator: async (value) => {
          const user = await mongoose.model("User").findById(value);
          return user && user.roleType === "interviewer";
        },
        message: "Invalid interviewer ID or role type.",
      },
    },
  ],
  candidate: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    validate: {
      validator: async (value) => {
        const user = await mongoose.model("User").findById(value);
        return user && user.roleType === "candidate";
      },
      message: "Invalid candidate ID or role type.",
    },
  },
  startTime: {
    type: Date,
    required: true,
  },
  duration: {
    type: Number,
    required: true,
  },
  endTime: {
    type: Date,
    required: true,
  },
  location: {
    type: String,
  },
  title: {
    type: String,
    required: true,
    minlength: 10,
    maxlength: 255,
  },
  description: {
    type: String,
    maxlength: 500,
  },
  interviewLink: {
    type: String,
    maxlength: 255,
  },
});

// Create Interview Model from the Schema
const Interview = mongoose.model("Interview", interviewSchema);

// Validate Interview Model
async function validateSchema(interview) {
  const { candidate } = interview;

  if (Array.isArray(candidate)) {
    return {
      error: {
        details: [{ message: "Multiple candidates not Allowed" }],
      },
    };
  }

  const schema = Joi.object({
    interviewers: Joi.array().items(JoiObjectId().required()).required().min(1),
    candidate: JoiObjectId().required(),
    startTime: Joi.date().required(),
    duration: Joi.number(),
    endTime: Joi.date().required(),
    location: Joi.string(),
    title: Joi.string().min(10).max(255),
    description: Joi.string().max(500),
    interviewLink: Joi.string().max(500),
  });
  return schema.validate(interview);
}

// Export Interview Model
module.exports.Interview = Interview;
module.exports.validate = validateSchema;
