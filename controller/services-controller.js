const { Service } = require("../models");

module.exports = {
    // Create a new service
    createService: async (req, res) => {
        try {
            const { description } = req.body;

            if (!description) {
                return res.status(400).json({
                    success: false,
                    message: 'Description is required'
                });
            }

            const service = await Service.create({
                Description: description,
                DateCreated: new Date(),
                DateUpdated: new Date()
            });

            res.status(201).json({
                success: true,
                data: service
            });
        } catch (error) {
            console.error('Error creating service:', error);
            res.status(500).json({
                success: false,
                message: 'Error creating service',
                error: error.message
            });
        }
    },

    // Get all services
    getAllServices: async (req, res) => {
        try {
            const services = await Service.findAll({
                order: [['DateCreated', 'DESC']]
            });

            res.json({
                success: true,
                data: services
            });
        } catch (error) {
            console.error('Error getting services:', error);
            res.status(500).json({
                success: false,
                message: 'Error getting services',
                error: error.message
            });
        }
    },

    // Get a single service
    getService: async (req, res) => {
        try {
            const { id } = req.params;
            const service = await Service.findByPk(id);

            if (!service) {
                return res.status(404).json({
                    success: false,
                    message: 'Service not found'
                });
            }

            res.json({
                success: true,
                data: service
            });
        } catch (error) {
            console.error('Error getting service:', error);
            res.status(500).json({
                success: false,
                message: 'Error getting service',
                error: error.message
            });
        }
    },

    // Update a service
    updateService: async (req, res) => {
        try {
            const { id } = req.params;
            const { description } = req.body;

            const service = await Service.findByPk(id);
            if (!service) {
                return res.status(404).json({
                    success: false,
                    message: 'Service not found'
                });
            }

            await service.update({
                Description: description,
                DateUpdated: new Date()
            });

            res.json({
                success: true,
                data: service
            });
        } catch (error) {
            console.error('Error updating service:', error);
            res.status(500).json({
                success: false,
                message: 'Error updating service',
                error: error.message
            });
        }
    },

    // Delete a service
    deleteService: async (req, res) => {
        try {
            const { id } = req.params;
            const service = await Service.findByPk(id);

            if (!service) {
                return res.status(404).json({
                    success: false,
                    message: 'Service not found'
                });
            }

            await service.destroy();
            res.json({
                success: true,
                message: 'Service deleted successfully'
            });
        } catch (error) {
            console.error('Error deleting service:', error);

            // Check if the error is a foreign key constraint violation
            if (error.name === 'SequelizeForeignKeyConstraintError') {
                return res.status(400).json({
                    success: false,
                    message: 'Cannot delete service. This service has scheduled appointments'
                });
            }

            res.status(500).json({
                success: false,
                message: 'Error deleting service',
                error: error.message
            });
        }
    }
}; 