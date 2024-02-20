const express = require("express"); // 1) import express 1st

const { body } = require("express-validator");

const User = require("../models/user");
const authController = require("../controllers/auth");

const router = express.Router(); //2)

router.put(
  "/signup",
  [
    // 3) Create 'PUT' route for new user (Or 'POST'?)
    body("email")
      .isEmail()
      .withMessage("Please enter a valid email.")
      .custom((value, { req }) => {
        return User.findOne({ email: value }).then((userDoc) => {
          if (userDoc) {
            return Promise.reject("Email address already exists.");
          }
        });
      })
      .normalizeEmail(),

    body("password").trim().isLength({ min: 5 }),

    body("name").trim().not().isEmpty(),
  ],
  authController.signup
);

router.post("/login", authController.login);

module.exports = router;
