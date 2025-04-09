const express = require("express");
const router = express.Router();
const { getAllUsers, createUser, login, verifyToken } = require("../controller/user-controller");
const { validateToken } = require("../middleware/Middleware");
// All routes require authentication
// Register new user
router.post("/register", [validateToken], createUser);

router.route("/", [validateToken])
    .get(getAllUsers)
    .post(createUser);

router.route("/login")
    .post(login);

router.route("/verify-token")
    .get(verifyToken);

module.exports = router;