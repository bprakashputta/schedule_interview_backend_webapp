const express = require("express");
const interviewRouter = express.Router();
const { Interview, validate } = require("../models/interview");
const { User } = require("../models/user");

// POST endpoint for creating interviews
interviewRouter.post("/create", async (request, response) => {
  // Validate the request body
  const { error } = validate(request.body);
  if (error) {
    return response.status(400).send(error.details[0].message);
  }

  try {
    // Validate start time and end time
    let startTime = new Date(request.body.startTime);
    let endTime = new Date(request.body.endTime);

    // Ensure time zone information is included
    startTime = new Date(startTime.toISOString());
    endTime = new Date(endTime.toISOString());

    if (startTime <= new Date() || endTime <= startTime) {
      return response.status(400).send("Invalid start time or end time.");
    }

    // Check interviewer availability
    const areInterviewersAvailable = await checkParticipantAvailability(
      request.body.interviewers,
      startTime,
      endTime,
      null
    );

    console.log("Intervieweers availability : ", areInterviewersAvailable);

    if (!areInterviewersAvailable) {
      return response
        .status(400)
        .send("Interviewers are not available at the specified time.");
    }

    // Check candidate availability
    const isCandidateAvailable = await checkParticipantAvailability(
      [request.body.candidate],
      startTime,
      endTime,
      null
    );

    if (!isCandidateAvailable) {
      // Return candidate not available at the specified time
      return response
        .status(400)
        .send("Candidate is not available at the specified time.");
    }

    // Continue with creating the interview
    const interview = new Interview({
      interviewers: request.body.interviewers,
      candidate: request.body.candidate,
      startTime: startTime,
      duration: (endTime - startTime) / (60 * 1000),
      endTime: endTime,
      location: request.body.location,
      title: request.body.title,
      description: request.body.description,
      interviewlink: request.body.interviewlink,
    });

    // Save the interview to the database
    await interview.save();

    // Update interview IDs for interviewers
    await Promise.all(
      request.body.interviewers.map(async (interviewerId) => {
        // Update the interview array in the participant's document
        await User.findByIdAndUpdate(
          interviewerId,
          { $push: { interviews: interview._id } },
          { new: true }
        );
      })
    );

    // Update interview ID for the candidate
    await User.findByIdAndUpdate(
      request.body.candidate,
      { $push: { interviews: interview._id } },
      { new: true }
    );

    // Send the created interview as the response
    response.send(interview);
  } catch (ex) {
    console.error(ex);
    response.status(500).send("Internal Server Error");
  }
});

interviewRouter.put("/update/:interviewId", async (request, response) => {
  //Get the interview Id
  const interviewId = request.params.interviewId;

  // Validate the request body
  const { error } = validate(request.body);
  if (error) {
    return response.status(400).send(error.details[0].message);
  }

  try {
    // Validate start time and end time
    let startTime = new Date(request.body.startTime);
    let endTime = new Date(request.body.endTime);

    // Ensure time zone information is included
    startTime = new Date(startTime.toISOString());
    endTime = new Date(endTime.toISOString());

    if (startTime <= new Date() || endTime <= startTime) {
      return response.status(400).send("Invalid start time or end time.");
    }

    // Check interviewer availability
    const areInterviewersAvailable = await checkParticipantAvailability(
      request.body.interviewers,
      startTime,
      endTime,
      interviewId
    );

    if (!areInterviewersAvailable) {
      return response
        .status(400)
        .send("Interviewers are not available at the specified time.");
    }

    // Check candidate availability
    const isCandidateAvailable = await checkParticipantAvailability(
      [request.body.candidate],
      startTime,
      endTime,
      interviewId
    );

    if (!isCandidateAvailable) {
      return response
        .status(400)
        .send("Candidate is not available at the specified time.");
    }

    // Update the interview
    const updatedInterview = await Interview.findByIdAndUpdate(
      interviewId,
      {
        interviewers: request.body.interviewers,
        candidate: request.body.candidate,
        startTime: startTime,
        duration: (endTime - startTime) / (60 * 1000),
        endTime: endTime,
        location: request.body.location,
        title: request.body.title,
        description: request.body.description,
        interviewlink: request.body.interviewlink,
      },
      { new: true } // Return the updated document
    );

    // Send the updated interview as the response
    response.send(updatedInterview);
  } catch (ex) {
    console.error(ex);
    response.status(500).send("Internal Server Error");
  }
});

// Function to get participant interview time slots using Mongoose
async function getParticipantInterviews(participantId) {
  try {
    // Replace 'interviews' with the actual field name where interview time slots are stored in your User schema
    const user = await User.findById(participantId, "interviews");

    return user.interviews || [];
  } catch (error) {
    console.error(error);
    throw new Error("Error fetching participant interview time slots");
  }
}

// Function to check participant availability for an interview (PUT API version)
async function checkParticipantAvailability(
  participants,
  startTime,
  endTime,
  excludedInterviewId
) {
  try {
    participants = Object.values(participants);

    // Check availability for each participant
    const areParticipantsAvailable = await Promise.all(
      participants.map(async (participantId) => {
        // Fetch interview time slots for the participant
        const participantInterviews = await getParticipantInterviews(
          participantId
        );

        console.log("Hi Bhanu");
        // Check if there's any overlap between the requested time and the participant's interview time slots
        const isOverlap = participantInterviews.some(async (interviewId) => {
          return await checkOverlap(
            interviewId,
            excludedInterviewId,
            startTime,
            endTime
          );
        });

        console.log("isOverlap : ", isOverlap);

        return !isOverlap; // Return true if no overlap, false if there's an overlap
      })
    );

    return areParticipantsAvailable.every(Boolean); // Return true if all participants are available, false otherwise
  } catch (error) {
    console.error(error);
    throw new Error("Error checking participant availability for update");
  }
}

async function checkOverlap(
  interviewId,
  excludedInterviewId,
  startTime,
  endTime
) {
  if (
    excludedInterviewId != null &&
    interviewId.toString() === excludedInterviewId.toString()
  ) {
    return false; // Exclude the current interview from overlap check
  }

  // Fetch the interview object
  let interview = await Interview.findById(interviewId);

  // Get the start and end times of the interview
  let interviewStartTime = new Date(interview.startTime);
  let interviewEndTime = new Date(interview.endTime);

  console.log("interviewStartTime", interviewStartTime);
  console.log("interviewEndTime", interviewEndTime);
  console.log("startTime", startTime);
  console.log("endTime", endTime);

  if (
    startTime.getTime() == interviewEndTime.getTime() ||
    endTime.getTime() == interviewStartTime.getTime()
  ) {
    console.log(
      "startTime.getTime() == interviewEndTime.getTime() ",
      startTime.getTime() == interviewEndTime.getTime()
    );
    return false;
  }

  return startTime < interviewEndTime && endTime > interviewStartTime;
}

module.exports = interviewRouter;
