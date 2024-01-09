// Import Packages
require("dotenv").config();
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const { request, response } = require("express");
const helmet = require("helmet");
const morgan = require("morgan");
const bodyParser = require("body-parser");
const { check, validationResult } = require("express-validator");
const path = require("path");
const PORT = 8082;

// Connect to Database
mongoose
  .connect(process.env.DATABASE_CONNECTION_URL)
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.log(err);
  });

const interviews = require("./routes/interviews");
const users = require("./routes/users");

// Set EJS Template Engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // parse url parameters to request body
app.use(express.static(path.join(__dirname, "public"))); // Serve static files like html, images, javascript to server
app.use(helmet()); // Secures the app by applying HTTP headers

// Routes
app.use("/api/user", users);
app.use("/api/interview", interviews);

app.listen(PORT, (err) => {
  if (err) {
    return err.message;
  }
  console.log("Server is running on Port", PORT);
});
