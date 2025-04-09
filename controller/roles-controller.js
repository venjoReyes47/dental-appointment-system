const { Role } = require("../models");
const { Op } = require("sequelize");

module.exports = {
    // Create a new role
    createRole: async (req, res) => {
        try {
            const { description } = req.body;
            const currentDate = new Date().toISOString();

            const newRole = await Role.create({
                Description: description,
                DateCreated: currentDate,
                DateUpdated: currentDate
            });

            res.status(201).json({
                success: true,
                data: {
                    roleId: newRole.RoleId,
                    description: newRole.Description,
                    dateCreated: newRole.DateCreated,
                    dateUpdated: newRole.DateUpdated
                }
            });
        } catch (error) {
            console.error('Create role error:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    },

    // Get all roles
    getAllRoles: async (req, res) => {
        try {
            const roles = await Role.findAll({
                order: [['RoleId', 'ASC']]
            });

            const formattedRoles = roles.map(role => ({
                roleId: role.RoleId,
                description: role.Description,
                dateCreated: role.DateCreated,
                dateUpdated: role.DateUpdated
            }));

            res.json({
                success: true,
                data: formattedRoles
            });
        } catch (error) {
            console.error('Get all roles error:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    },

    // Get role by ID
    getRoleById: async (req, res) => {
        try {
            const { id } = req.params;
            const role = await Role.findByPk(id);

            if (!role) {
                return res.status(404).json({
                    success: false,
                    message: "Role not found"
                });
            }

            res.json({
                success: true,
                data: {
                    roleId: role.RoleId,
                    description: role.Description,
                    dateCreated: role.DateCreated,
                    dateUpdated: role.DateUpdated
                }
            });
        } catch (error) {
            console.error('Get role by ID error:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    },

    // Update role
    updateRole: async (req, res) => {
        try {
            const { id } = req.params;
            const { description } = req.body;
            const currentDate = new Date().toISOString();

            const role = await Role.findByPk(id);
            if (!role) {
                return res.status(404).json({
                    success: false,
                    message: "Role not found"
                });
            }

            await role.update({
                Description: description,
                DateUpdated: currentDate
            });

            res.json({
                success: true,
                data: {
                    roleId: role.RoleId,
                    description: role.Description,
                    dateCreated: role.DateCreated,
                    dateUpdated: role.DateUpdated
                }
            });
        } catch (error) {
            console.error('Update role error:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    },

    // Delete role
    deleteRole: async (req, res) => {
        try {
            const { id } = req.params;
            const role = await Role.findByPk(id);

            if (!role) {
                return res.status(404).json({
                    success: false,
                    message: "Role not found"
                });
            }

            // Check if role is being used
            const userRoles = await role.getUserRoles();
            if (userRoles.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: "Cannot delete role as it is assigned to users"
                });
            }

            await role.destroy();
            res.json({
                success: true,
                message: "Role deleted successfully"
            });
        } catch (error) {
            console.error('Delete role error:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
}; 