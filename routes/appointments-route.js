const express = require("express");
const router = express.Router();
const {
    createAppointment,
    getAllAppointments,
    updateAppointment,
    deleteAppointment,
    getAppointmentsByDateAndUser
} = require("../controller/appointment-controller");
const { validateUser, validateDate, validateToken } = require("../middleware/Middleware");

// All routes require authentication
router.use(validateToken);
// Create a new appointment
router.post("/", [validateUser, validateDate], createAppointment);

// Get all appointments with optional filters
router.get("/", getAllAppointments);

// Get appointments for a specific date and user
router.get("/date/:date/user/:userId", getAppointmentsByDateAndUser);

// Get a single appointment
router.get("/:id", getAllAppointments);

// Update an appointment
router.put("/:id", [validateDate], updateAppointment);

// Delete an appointment
router.delete("/:id", deleteAppointment);

module.exports = router; 