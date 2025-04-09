const { User, UserRole } = require("../models");
const bcrypt = require("bcryptjs");
const { Op } = require("sequelize");

module.exports = {
    createDentist: async (req, res) => {
        try {
            const { firstName, lastName, email, phoneNumber, gender, password } = req.body;

            // Check if user already exists
            const existingUser = await User.findOne({ where: { Email: email } });
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: 'Dentist with this email already exists'
                });
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(password, 10);

            // Start a transaction
            const transaction = await User.sequelize.transaction();

            try {
                // Create user
                const dentist = await User.create({
                    Email: email,
                    Password: hashedPassword,
                    FirstName: firstName,
                    LastName: lastName,
                    Gender: gender,
                    Phone: phoneNumber,
                    IsActive: 1,
                    DateUpdated: new Date().toISOString()
                }, { transaction });

                // Create user role entry for dentist (roleId: 1)
                await UserRole.create({
                    UserId: dentist.UserId,
                    RoleId: 1, // Dentist role
                    DateUpdated: new Date().toISOString()
                }, { transaction });

                // Commit the transaction
                await transaction.commit();

                res.status(201).json({
                    success: true,
                    message: 'Dentist created successfully',
                    data: {
                        userId: dentist.UserId,
                        firstName: dentist.FirstName,
                        lastName: dentist.LastName,
                        email: dentist.Email,
                        gender: dentist.Gender,
                        phone: dentist.Phone,
                        roleId: 1
                    }
                });
            } catch (error) {
                // Rollback the transaction if there's an error
                await transaction.rollback();
                throw error;
            }
        } catch (error) {
            console.error('Error creating dentist:', error);
            res.status(500).json({
                success: false,
                message: 'Error creating dentist',
                error: error.message
            });
        }
    },

    getAllDentists: async (req, res) => {
        try {
            const { page = 1, limit = 10, search } = req.query;
            const offset = (page - 1) * limit;

            let whereClause = {};
            if (search) {
                whereClause = {
                    [Op.or]: [
                        { FirstName: { [Op.like]: `%${search}%` } },
                        { LastName: { [Op.like]: `%${search}%` } },
                        { Email: { [Op.like]: `%${search}%` } }
                    ]
                };
            }

            const { count, rows } = await User.findAndCountAll({
                where: whereClause,
                include: [{
                    model: UserRole,
                    as: 'role',
                    where: { RoleId: 1 }, // Only get dentists
                    attributes: ['RoleId']
                }],
                limit: parseInt(limit),
                offset: offset,
                order: [['FirstName', 'ASC']]
            });

            const dentists = rows.map(dentist => ({
                userId: dentist.UserId,
                firstName: dentist.FirstName,
                lastName: dentist.LastName,
                email: dentist.Email,
                gender: dentist.Gender,
                phone: dentist.Phone,
                isActive: dentist.IsActive,
                roleId: dentist.role.RoleId
            }));

            res.json({
                success: true,
                data: dentists,
                pagination: {
                    total: count,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    totalPages: Math.ceil(count / limit)
                }
            });
        } catch (error) {
            console.error('Error getting dentists:', error);
            res.status(500).json({
                success: false,
                message: 'Error retrieving dentists',
                error: error.message
            });
        }
    },

    getDentistById: async (req, res) => {
        try {
            const { id } = req.params;

            const dentist = await User.findOne({
                where: { UserId: id },
                include: [{
                    model: UserRole,
                    as: 'role',
                    where: { RoleId: 1 }, // Ensure it's a dentist
                    attributes: ['RoleId']
                }]
            });

            if (!dentist) {
                return res.status(404).json({
                    success: false,
                    message: 'Dentist not found'
                });
            }

            res.json({
                success: true,
                data: {
                    userId: dentist.UserId,
                    firstName: dentist.FirstName,
                    lastName: dentist.LastName,
                    email: dentist.Email,
                    gender: dentist.Gender,
                    phone: dentist.Phone,
                    isActive: dentist.IsActive,
                    roleId: dentist.role.RoleId
                }
            });
        } catch (error) {
            console.error('Error getting dentist:', error);
            res.status(500).json({
                success: false,
                message: 'Error retrieving dentist',
                error: error.message
            });
        }
    },

    updateDentist: async (req, res) => {
        try {
            const { id } = req.params;
            const { firstName, lastName, email, phone, gender, password, isActive } = req.body;

            // Start transaction
            const transaction = await User.sequelize.transaction();

            try {
                // Find dentist
                const dentist = await User.findOne({
                    where: { UserId: id },
                    include: [{
                        model: UserRole,
                        as: 'role',
                        where: { RoleId: 1 }, // Ensure it's a dentist
                        attributes: ['RoleId']
                    }]
                });

                if (!dentist) {
                    await transaction.rollback();
                    return res.status(404).json({
                        success: false,
                        message: 'Dentist not found'
                    });
                }

                // Update user data
                const updateData = {
                    FirstName: firstName || dentist.FirstName,
                    LastName: lastName || dentist.LastName,
                    Email: email || dentist.Email,
                    Gender: gender || dentist.Gender,
                    Phone: phone || dentist.Phone,
                    IsActive: isActive !== undefined ? isActive : dentist.IsActive,
                    DateUpdated: new Date().toISOString()
                };

                // If password is provided, hash it
                if (password) {
                    updateData.Password = await bcrypt.hash(password, 10);
                }

                await dentist.update(updateData, { transaction });

                // Commit transaction
                await transaction.commit();

                res.json({
                    success: true,
                    message: 'Dentist updated successfully',
                    data: {
                        userId: dentist.UserId,
                        firstName: updateData.FirstName,
                        lastName: updateData.LastName,
                        email: updateData.Email,
                        gender: updateData.Gender,
                        phone: updateData.Phone,
                        isActive: updateData.IsActive,
                        roleId: dentist.role.RoleId
                    }
                });
            } catch (error) {
                await transaction.rollback();
                throw error;
            }
        } catch (error) {
            console.error('Error updating dentist:', error);
            res.status(500).json({
                success: false,
                message: 'Error updating dentist',
                error: error.message
            });
        }
    },

    deleteDentist: async (req, res) => {
        try {
            const { id } = req.params;

            // Start transaction
            const transaction = await User.sequelize.transaction();

            try {
                // Find dentist
                const dentist = await User.findOne({
                    where: { UserId: id },
                    include: [{
                        model: UserRole,
                        as: 'role',
                        where: { RoleId: 1 }, // Ensure it's a dentist
                        attributes: ['RoleId']
                    }]
                });

                if (!dentist) {
                    await transaction.rollback();
                    return res.status(404).json({
                        success: false,
                        message: 'Dentist not found'
                    });
                }

                // Delete user role first
                await UserRole.destroy({
                    where: { UserId: id },
                    transaction
                });

                // Delete user
                await dentist.destroy({ transaction });

                // Commit transaction
                await transaction.commit();

                res.json({
                    success: true,
                    message: 'Dentist deleted successfully'
                });
            } catch (error) {
                await transaction.rollback();

                // Check if the error is a foreign key constraint violation
                if (error.name === 'SequelizeForeignKeyConstraintError') {
                    return res.status(400).json({
                        success: false,
                        message: 'Cannot delete dentist. This dentist has scheduled appointments'
                    });
                }

                throw error;
            }
        } catch (error) {
            console.error('Error deleting dentist:', error);
            res.status(500).json({
                success: false,
                message: 'Error deleting dentist',
                error: error.message
            });
        }
    }
}; 