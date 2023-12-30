// const generateUsername = require("unique-username-generator");
const express = require("express");
const userRouter = express.Router();
const mongoose = require("mongoose");
const { User, validate } = require("../models/user");
const { request, response } = require("express");

userRouter.get("/", async (request, response) => {
  try {
    let users = await User.find().sort("name");
    console.log("Users :", users);
    return response.send(users);
  } catch (error) {
    console.error(error.message);
    return response.status(500).send("Internal Server Error");
  }
});

userRouter.post("/adduser", async (request, response) => {
  console.log("#######################################################");
  const { error } = await validate(request.body);
  if (error) {
    return response.status(400).send(error.details[0].message);
  }

  let user = await User.findOne({ email: request.body.emailId });
  console.log("User :", user);
  if (user) {
    return response.status(400).send("User with the email already exists");
  } else {
    user = new User({
      username: request.body.username,
      // username: generateUsername.generateFromEmail(request.body.emailId),
      name: request.body.name,
      email: request.body.emailId,
      // Commenting the password field because I'm not enforcing login criteria at this moment.
      //   password: request.body.password,
      roleType: request.body.roleType, // Assuming you have a roleType field
      resumeLink: request.body.resumeLink,
    });

    try {
      await user.save();
    } catch (ex) {
      console.log(ex.message);
      return response.status(400).send(ex.message);
    }
  }

  console.log("User :", user);
  return response.send(user);
});

// Route to create multiple users from JSON data
userRouter.post("/addmultipleusers", async (request, response) => {
  try {
    // Validate and create users
    const createdUsers = await Promise.all(
      request.body.map(async (userData) => {
        const { error } = validate(userData);
        if (error) {
          return Promise.reject(error.details[0].message);
        }

        const existingUser = await User.findOne({ email: userData.email });
        if (existingUser) {
          return Promise.reject(
            `User with email ${userData.email} already exists`
          );
        }

        const newUser = new User({
          username: userData.username,
          name: userData.name,
          email: userData.email,
          password: userData.password,
          roleType: userData.roleType,
          resumeLink: userData.resumeLink,
        });

        return newUser.save();
      })
    );

    response.status(200).json({ success: true, createdUsers });
  } catch (error) {
    console.error(error);
    response
      .status(500)
      .json({ success: false, error: "Internal Server Error" });
  }
});

// PUT route to update user information
userRouter.put("/updateuser/:userId", async (request, response) => {
  const userId = request.params.userId;

  try {
    // Validate the user ID
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return response
        .status(400)
        .json({ success: false, error: "Invalid user ID" });
    }

    // Validate the updated user data
    const { error } = await validate(request.body);
    if (error) {
      return response.status(400).send(error.details[0].message);
    }

    // Find the user by ID
    const user = await User.findByIdAndUpdate(userId, request.body, {
      new: true,
    });

    // Check if the user exists
    if (!user) {
      return response
        .status(404)
        .json({ success: false, error: "User not found" });
    }

    // Save the changes
    await user.save();

    // Send the updated user as a response
    response.status(200).json({ success: true, updatedUser: user });
  } catch (error) {
    console.error(error);
    response
      .status(500)
      .json({ success: false, error: "Internal Server Error" });
  }
});

module.exports = userRouter;
