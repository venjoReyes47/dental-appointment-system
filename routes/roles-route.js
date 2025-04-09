const express = require("express");
const router = express.Router();
const rolesController = require("../controller/roles-controller");
const { validateToken } = require("../middleware/Middleware");
// All routes require authentication
router.use(validateToken);
// Create a new role
router.post("/", rolesController.createRole);

// Get all roles
router.get("/", rolesController.getAllRoles);

// Get role by ID
router.get("/:id", rolesController.getRoleById);

// Update role
router.put("/:id", rolesController.updateRole);

// Delete role
router.delete("/:id", rolesController.deleteRole);

module.exports = router; 