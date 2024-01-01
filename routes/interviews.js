const express = require("express");
const interviewRouter = express.Router();
const { Interview, validate } = require("../models/interview");
const { User } = require("../models/user");

// POST endpoint for creating interviews
interviewRouter.post("/create", async (req, res) => {
  // Validate the request body
  const { error } = validate(req.body);
  if (error) {
    return res.status(400).send(error.details[0].message);
  }

  try {
    // Validate start time and end time
    const startTime = new Date(req.body.startTime);
    const endTime = new Date(req.body.endTime);

    if (startTime <= new Date() || endTime <= startTime) {
      return res.status(400).send("Invalid start time or end time.");
    }

    // Check interviewer availability
    const areInterviewersAvailable = checkParticipantAvailability(
      req.body.interviewer,
      startTime,
      endTime
    );

    if (!areInterviewersAvailable) {
      return res
        .status(400)
        .send("Interviewers are not available at the specified time.");
    }

    // Check candidate availability
    const isCandidateAvailable = checkParticipantAvailability(
      [req.body.candidate],
      startTime,
      endTime
    );

    if (!isCandidateAvailable) {
      return res
        .status(400)
        .send("Candidate is not available at the specified time.");
    }

    // Continue with creating the interview
    const interview = new Interview({
      interviewer: req.body.interviewer,
      candidate: req.body.candidate,
      startTime: startTime,
      duration: req.body.duration,
      endTime: endTime,
      location: req.body.location,
      title: req.body.title,
      description: req.body.description,
      interviewlink: req.body.interviewlink,
    });

    // Save the interview to the database
    await interview.save();

    // Send the created interview as the response
    res.send(interview);
  } catch (ex) {
    console.error(ex);
    res.status(500).send("Internal Server Error");
  }
});

const mongoose = require("mongoose");
const { User } = require("../models/user"); // Assuming your User model is in this file

// Function to get participant interview time slots using Mongoose
async function getParticipantAvailability(participantId) {
  try {
    // Replace 'interviews' with the actual field name where interview time slots are stored in your User schema
    const user = await User.findById(participantId, "interviews");

    return user.interviews || [];
  } catch (error) {
    console.error(error);
    throw new Error("Error fetching participant interview time slots");
  }
}

// Function to check participant availability
async function checkParticipantAvailability(participants, startTime, endTime) {
  try {
    // Check availability for each participant
    const areParticipantsAvailable = await Promise.all(
      participants.map(async (participantId) => {
        // Fetch interview time slots for the participant
        const participantInterviews = await getParticipantAvailability(
          participantId
        );

        // Check if there's any overlap between the requested time and the participant's interview time slots
        const isOverlap = participantInterviews.some((interview) => {
          const interviewStartTime = new Date(interview.startTime);
          const interviewEndTime = new Date(interview.endTime);

          return startTime < interviewEndTime && endTime > interviewStartTime;
        });

        return !isOverlap; // Return true if no overlap, false if there's an overlap
      })
    );

    return areParticipantsAvailable.every(Boolean); // Return true if all participants are available, false otherwise
  } catch (error) {
    console.error(error);
    throw new Error("Error checking participant availability");
  }
}

module.exports = interviewRouter;
