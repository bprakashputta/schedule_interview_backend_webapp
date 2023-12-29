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

app.listen(PORT, (err) => {
  if (err) {
    return err.message;
  }
  console.log("Server is running on Port", PORT);
});
