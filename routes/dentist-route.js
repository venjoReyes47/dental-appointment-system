const express = require("express");
const router = express.Router();
const {
    createDentist,
    getAllDentists,
    getDentistById,
    updateDentist,
    deleteDentist
} = require("../controller/dentist-controller");
const { validateToken } = require("../middleware/Middleware");

// All routes require authentication
router.use(validateToken);

// CRUD routes for dentists
router.post("/", createDentist);
router.get("/", getAllDentists);
router.get("/:id", getDentistById);
router.put("/:id", updateDentist);
router.delete("/:id", deleteDentist);

module.exports = router; 