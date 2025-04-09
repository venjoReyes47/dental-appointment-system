const { User, UserRole } = require("../models");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const {
    validateUserCreation,
    validateLogin,
    buildPaginationOptions,
    hashPassword,
    verifyPassword,
    sanitizeUserData
} = require("../middleware/Middleware");
const { Op } = require("sequelize");
const bcrypt = require("bcryptjs");

module.exports = {
    createUser: async (req, res) => {
        try {
            const { firstName, lastName, email, phone, gender, password, roleId } = req.body;

            // Check if user already exists
            const existingUser = await User.findOne({ where: { Email: email } });
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: 'User with this email already exists'
                });
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(password, 10);

            // Start a transaction
            const transaction = await User.sequelize.transaction();

            try {
                // Create user with patient role (roleId: 2)
                const user = await User.create({
                    Email: email,
                    Password: hashedPassword,
                    FirstName: firstName,
                    LastName: lastName,
                    Gender: gender,
                    Phone: phone,
                    IsActive: 1,
                    DateUpdated: new Date().toISOString()
                }, { transaction });

                // Create user role entry
                await UserRole.create({
                    UserId: user.UserId,
                    RoleId: roleId, // Patient role
                    DateUpdated: new Date().toISOString()
                }, { transaction });

                // Commit the transaction
                await transaction.commit();

                res.status(201).json({
                    success: true,
                    message: 'User created successfully',
                    data: {
                        userId: user.UserId,
                        firstName: user.FirstName,
                        lastName: user.LastName,
                        email: user.Email,
                        roleId: 2
                    }
                });
            } catch (error) {
                // Rollback the transaction if there's an error
                await transaction.rollback();
                throw error;
            }
        } catch (error) {
            console.error('Error creating user:', error);
            res.status(500).json({
                success: false,
                message: 'Error creating user',
                error: error.message
            });
        }
    },

    getAllUsers: async (req, res) => {
        try {
            const { page, limit, offset, sortBy, sortOrder, whereClause } = buildPaginationOptions(req);

            const total = await User.count({ where: whereClause });
            const users = await User.findAll({
                where: whereClause,
                order: [[sortBy, sortOrder]],
                limit,
                offset
            });

            const formattedUsers = users.map(user => ({
                userId: user.UserId,
                email: user.Email,
                firstName: user.FirstName,
                lastName: user.LastName,
                gender: user.Gender,
                phone: user.Phone,
                isActive: user.IsActive,
                dateUpdated: user.DateUpdated
            }));

            res.json({
                success: true,
                data: formattedUsers,
                pagination: {
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit)
                }
            });
        } catch (error) {
            console.error('Get all users error:', error);
            res.status(500).json({
                success: false,
                error: "Error retrieving users",
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    },

    login: async (req, res) => {
        try {
            const { email, password } = req.body;

            // Find user with their role
            const user = await User.findOne({
                where: { Email: email },
                include: [{
                    model: UserRole,
                    as: 'role',
                    attributes: ['RoleId']
                }]
            });

            if (!user) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid credentials'
                });
            }

            const isPasswordValid = await bcrypt.compare(password, user.Password);
            if (!isPasswordValid) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid credentials'
                });
            }

            // Update last login
            await user.update({
                DateUpdated: new Date().toISOString()
            });

            // Get user role
            const userRole = user.role ? user.role.RoleId : 2; // Default to patient role if not found

            // Generate access token
            const accessToken = jwt.sign(
                {
                    id: user.UserId,
                    email: user.Email,
                    role: userRole
                },
                process.env.JWT_SECRET_KEY,
                { expiresIn: process.env.JWT_TOKEN_EXPIRATION || "1h" }
            );

            // Generate refresh token
            const refreshToken = jwt.sign(
                {
                    id: user.UserId,
                    email: user.Email
                },
                process.env.JWT_REFRESH_SECRET_KEY,
                { expiresIn: "7d" }
            );

            res.json({
                success: true,
                message: 'Login successful',
                data: {
                    user: {
                        userId: user.UserId,
                        firstName: user.FirstName,
                        lastName: user.LastName,
                        email: user.Email,
                        roleId: userRole
                    },
                    tokens: {
                        accessToken,
                        refreshToken,
                        expiresIn: process.env.JWT_TOKEN_EXPIRATION || "1h"
                    }
                }
            });
        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({
                success: false,
                message: 'Error during login',
                error: error.message
            });
        }
    },

    // Add refresh token function
    refreshToken: async (req, res) => {
        try {
            const { refreshToken } = req.body;

            if (!refreshToken) {
                return res.status(400).json({
                    success: false,
                    message: "Refresh token is required"
                });
            }

            try {
                const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET_KEY);
                const user = await User.findByPk(decoded.id);

                if (!user) {
                    return res.status(404).json({
                        success: false,
                        message: "User not found"
                    });
                }

                const newAccessToken = jwt.sign(
                    {
                        id: user.UserId,
                        email: user.Email,
                        role: user.RoleId
                    },
                    process.env.JWT_SECRET_KEY,
                    { expiresIn: process.env.JWT_TOKEN_EXPIRATION || "1h" }
                );

                res.json({
                    success: true,
                    data: {
                        accessToken: newAccessToken,
                        expiresIn: process.env.JWT_TOKEN_EXPIRATION || "1h"
                    }
                });
            } catch (error) {
                return res.status(401).json({
                    success: false,
                    message: "Invalid refresh token"
                });
            }
        } catch (error) {
            console.error('Refresh token error:', error);
            res.status(500).json({
                success: false,
                message: "Internal server error during token refresh",
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    },

    verifyToken: async (req, res) => {
        try {
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return res.status(401).json({
                    success: false,
                    message: 'No token provided'
                });
            }

            const token = authHeader.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

            // Find user with their role
            const user = await User.findOne({
                where: { UserId: decoded.id },
                include: [{
                    model: UserRole,
                    as: 'role',
                    attributes: ['RoleId']
                }]
            });

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            // Get user role
            const userRole = user.role ? user.role.RoleId : 2;

            // Generate new access token
            const newAccessToken = jwt.sign(
                {
                    id: user.UserId,
                    email: user.Email,
                    role: userRole
                },
                process.env.JWT_SECRET_KEY,
                { expiresIn: process.env.JWT_TOKEN_EXPIRATION || "1h" }
            );

            // Generate new refresh token
            const newRefreshToken = jwt.sign(
                {
                    id: user.UserId,
                    email: user.Email
                },
                process.env.JWT_REFRESH_SECRET_KEY,
                { expiresIn: "7d" }
            );

            res.json({
                success: true,
                message: 'Token verified successfully',
                data: {
                    user: {
                        userId: user.UserId,
                        firstName: user.FirstName,
                        lastName: user.LastName,
                        email: user.Email,
                        roleId: userRole
                    },
                    tokens: {
                        accessToken: newAccessToken,
                        refreshToken: newRefreshToken,
                        expiresIn: process.env.JWT_TOKEN_EXPIRATION || "1h"
                    }
                }
            });
        } catch (error) {
            if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid or expired token'
                });
            }
            console.error('Token verification error:', error);
            res.status(500).json({
                success: false,
                message: 'Error verifying token',
                error: error.message
            });
        }
    }
};
