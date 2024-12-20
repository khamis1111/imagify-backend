const express = require("express");
const {
  createSession,
  credits,
  login,
  register,
  verifySession,
} = require("../controllers/user.controller.js");
const authToken = require("../middleware/auth.middleware.js");
const { imageGenerate } = require("../controllers/image.controller.js");

const routes = express.Router();

routes.post("/login", login);
routes.post("/register", register);
routes.get("/credits", authToken, credits);
routes.post("/image-generate", authToken, imageGenerate);

routes.post("/stripe-session", authToken, createSession);
routes.post("/webhook", verifySession);

module.exports = routes;
