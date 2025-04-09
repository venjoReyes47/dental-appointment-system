const express = require('express');
const router = express.Router();
const { createService, getAllServices, getService, updateService, deleteService } = require('../controller/services-controller');
const { validateToken } = require("../middleware/Middleware");
// All routes require authentication
router.use(validateToken);
// Create a new service
router.post('/', createService);

// Get all services
router.get('/', getAllServices);

// Get a single service
router.get('/:id', getService);

// Update a service
router.put('/:id', updateService);

// Delete a service
router.delete('/:id', deleteService);

module.exports = router; 