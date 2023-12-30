const mongoose = require("mongoose");
const Joi = require("joi");
JoiObjectId = require("joi-objectid")(Joi);

const interviewSchema = new mongoose.Schema({
  interviewers: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      validate: {
        validator: async function (value) {
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
      validator: async function (value) {
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
    enum: [30, 45, 60, 90, 120],
    required: true,
  },
  endTime: {
    type: Date,
    // You can handle this with a virtual property
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
  interviewlink: {
    type: String,
    maxlength: 255,
  },
});

const Interview = mongoose.model("Interview", interviewSchema);

async function validateSchema(interview) {
  const schema = Joi.object({
    interviewers: Joi.array()
      .items(Joi.object({ userId: JoiObjectId().required() }))
      .required()
      .min(1),
    candidateId: JoiObjectId().required(),
    startTime: Joi.date().required(),
    duration: Joi.number().valid(30, 45, 60, 90, 120).required(),
    endTime: Joi.date(),
    location: Joi.string(),
    title: Joi.string().min(10).max(255),
    description: Joi.string().max(500),
    interviewlink: Joi.string().max(500),
  });
  return schema.validate(interview);
}

module.exports.Interview = Interview;
module.exports.validateSchema = validateSchema;
