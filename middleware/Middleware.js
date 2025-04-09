const { Appointment, User } = require("../models");
const { Op } = require("sequelize");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require('nodemailer');

// Appointment Conflict Check Middleware
const checkAppointmentConflict = async (req, res, next) => {
    try {
        const { appointmentDate, patientUserId, dentistUserId } = req.body;
        const appointmentId = req.params.id; // For update operations

        // Validate required fields
        if (!appointmentDate || !patientUserId || !dentistUserId) {
            return res.status(400).json({
                error: "Missing required fields",
                required: ["AppointmentDate", "PatientUserId", "DentistUserId"]
            });
        }

        // Validate date format and convert to Date object
        const appointmentDateFormat = new Date(appointmentDate);
        if (isNaN(appointmentDateFormat.getTime())) {
            return res.status(400).json({ error: "Invalid date format" });
        }

        // Set time range for the day (00:00:00 to 23:59:59)
        const startOfDay = new Date(appointmentDateFormat);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(appointmentDateFormat);
        endOfDay.setHours(23, 59, 59, 999);

        // Calculate one hour before and after the appointment time
        const oneHourBefore = new Date(appointmentDateFormat);
        oneHourBefore.setHours(appointmentDateFormat.getHours() - 1);

        const oneHourAfter = new Date(appointmentDateFormat);
        oneHourAfter.setHours(appointmentDateFormat.getHours() + 1);

        // Check for appointment conflicts
        const whereClause = {
            [Op.and]: [
                {
                    [Op.or]: [
                        {
                            dentistUserId,
                            appointmentDate: {
                                [Op.between]: [oneHourBefore, oneHourAfter]
                            }
                        },
                        {
                            patientUserId,
                            appointmentDate: {
                                [Op.between]: [oneHourBefore, oneHourAfter]
                            }
                        }
                    ]
                },
                {
                    Status: {
                        [Op.ne]: 'X' // Exclude cancelled appointments
                    }
                }
            ]
        };

        // For update operations, exclude the current appointment from conflict check
        if (appointmentId) {
            whereClause[Op.and][0][Op.or][0].AppointmentId = { [Op.ne]: appointmentId };
            whereClause[Op.and][0][Op.or][1].AppointmentId = { [Op.ne]: appointmentId };
        }

        const existingAppointment = await Appointment.findOne({
            where: whereClause
        });

        if (existingAppointment) {
            return res.status(400).json({
                error: "Appointment conflict: Time slot already booked or too close to another appointment",
                details: {
                    existingAppointmentId: existingAppointment.AppointmentId,
                    existingAppointmentDate: existingAppointment.AppointmentDate,
                    existingPatientId: existingAppointment.PatientUserId,
                    existingDentistId: existingAppointment.DentistUserId,
                    message: "Appointments must be at least 1 hour apart"
                }
            });
        }

        next();
    } catch (error) {
        console.error('Appointment conflict check error:', error);
        res.status(500).json({ error: error.message });
    }
};

// User Validation Middleware
const validateUser = async (req, res, next) => {
    try {
        const { patientUserId, dentistUserId } = req.body;

        // Check if both users exist
        const [patient, dentist] = await Promise.all([
            User.findByPk(patientUserId),
            User.findByPk(dentistUserId)
        ]);

        if (!patient || !dentist) {
            return res.status(404).json({ error: "Patient or Dentist not found" });
        }

        next();
    } catch (error) {
        console.error('User validation error:', error);
        res.status(500).json({ error: error.message });
    }
};

// Date Validation Middleware
const validateDate = (req, res, next) => {
    try {
        const { appointmentDate } = req.body;

        if (appointmentDate) {
            const date = new Date(appointmentDate);
            if (isNaN(date.getTime())) {
                return res.status(400).json({ error: "Invalid date format" });
            }

            // Check if date is in the future
            if (date < new Date()) {
                return res.status(400).json({ error: "Appointment date must be in the future" });
            }
        }

        next();
    } catch (error) {
        console.error('Date validation error:', error);
        res.status(500).json({ error: error.message });
    }
};

// Status Validation Middleware
const validateStatus = (req, res, next) => {
    try {
        const { Status } = req.body;

        if (Status !== undefined) {
            const validStatuses = [0, 1, 2, 3]; // 0: Pending, 1: Confirmed, 2: Cancelled, 3: Completed
            if (!validStatuses.includes(Status)) {
                return res.status(400).json({
                    error: "Invalid status",
                    validStatuses: {
                        0: "Pending",
                        1: "Confirmed",
                        2: "Cancelled",
                        3: "Completed"
                    }
                });
            }
        }

        next();
    } catch (error) {
        console.error('Status validation error:', error);
        res.status(500).json({ error: error.message });
    }
};

// Password Validation
const validatePassword = (password) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (password.length < minLength) {
        return { valid: false, message: "Password must be at least 8 characters long" };
    }
    if (!hasUpperCase) {
        return { valid: false, message: "Password must contain at least one uppercase letter" };
    }
    if (!hasLowerCase) {
        return { valid: false, message: "Password must contain at least one lowercase letter" };
    }
    if (!hasNumbers) {
        return { valid: false, message: "Password must contain at least one number" };
    }
    if (!hasSpecialChar) {
        return { valid: false, message: "Password must contain at least one special character" };
    }
    return { valid: true };
};

// Email Validation
const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

// User Data Sanitization
const sanitizeUserData = (user) => {
    const { Password, CreatedBy, DateUpdated, ...sanitizedUser } = user.toJSON();
    return sanitizedUser;
};

// User Creation Validation
const validateUserCreation = async (req, res, next) => {
    const { Email, Password, FirstName, LastName } = req.body;

    // Check required fields
    if (!Email || !Password || !FirstName || !LastName) {
        return res.status(400).json({
            error: "Missing required fields",
            required: ["Email", "Password", "FirstName", "LastName"]
        });
    }

    // Validate email format
    if (!validateEmail(Email)) {
        return res.status(400).json({ error: "Invalid email format" });
    }

    // Validate password strength
    const passwordValidation = validatePassword(Password);
    if (!passwordValidation.valid) {
        return res.status(400).json({ error: passwordValidation.message });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ where: { Email } });
    if (existingUser) {
        return res.status(400).json({ error: "Email already registered" });
    }

    next();
};

// User Login Validation
const validateLogin = (req, res, next) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
    }

    next();
};

// Build Pagination and Filter Options
const buildPaginationOptions = (req) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const sortBy = req.query.sortBy || 'UserId';
    const sortOrder = req.query.sortOrder === 'desc' ? 'DESC' : 'ASC';
    const search = req.query.search || '';
    const isActive = req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined;

    const offset = (page - 1) * limit;

    const whereClause = {};
    if (search) {
        whereClause[Op.or] = [
            { FirstName: { [Op.like]: `%${search}%` } },
            { LastName: { [Op.like]: `%${search}%` } },
            { Email: { [Op.like]: `%${search}%` } }
        ];
    }
    if (isActive !== undefined) {
        whereClause.IsActive = isActive ? 1 : 0;
    }

    return {
        page,
        limit,
        offset,
        sortBy,
        sortOrder,
        whereClause
    };
};

// Hash Password
const hashPassword = async (password) => {
    try {
        return await bcrypt.hash(password, 12);
    } catch (error) {
        throw new Error("Error processing password");
    }
};

// Verify Password
const verifyPassword = async (password, hashedPassword) => {
    return await bcrypt.compare(password, hashedPassword);
};

// JWT Token Validation
const validateToken = (req, res, next) => {
    try {
        const authHeader = req.header('Authorization');
        if (!authHeader) {
            return res.status(401).json({
                success: false,
                message: "Access denied. No token provided."
            });
        }

        const token = authHeader.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Invalid token format."
            });
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

            // Add token expiration check
            const currentTime = Math.floor(Date.now() / 1000);
            if (decoded.exp && decoded.exp < currentTime) {
                return res.status(401).json({
                    success: false,
                    message: "Token has expired."
                });
            }

            // Add user to request object
            req.user = {
                id: decoded.id,
                email: decoded.email,
                token: token
            };

            next();
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({
                    success: false,
                    message: "Token has expired."
                });
            }
            return res.status(401).json({
                success: false,
                message: "Invalid token."
            });
        }
    } catch (error) {
        console.error('Token validation error:', error);
        res.status(500).json({
            success: false,
            message: "Internal server error during token validation."
        });
    }
};

// Check User Role Middleware
const checkRole = (roles) => {
    return async (req, res, next) => {
        try {
            const user = await User.findByPk(req.user.id);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: "User not found."
                });
            }

            if (!roles.includes(user.RoleId)) {
                return res.status(403).json({
                    success: false,
                    message: "Access denied. Insufficient permissions."
                });
            }

            next();
        } catch (error) {
            console.error('Role check error:', error);
            res.status(500).json({
                success: false,
                message: "Internal server error during role check."
            });
        }
    };
};

// Email Sending Middleware
const sendEmail = async (to, subject, text, html) => {
    try {
        // Create a transporter using SMTP
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });

        // Email options
        const mailOptions = {
            from: process.env.SMTP_FROM,
            to: to,
            subject: subject,
            text: text,
            html: html
        };

        // Send email
        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent:', info.messageId);
        return true;
    } catch (error) {
        console.error('Error sending email:', error);
        throw error;
    }
};

// Appointment Confirmation Email
const sendAppointmentConfirmationEmail = async (appointment, patient) => {
    const subject = 'Appointment Confirmation';
    const text = `Your appointment has been confirmed for ${new Date(appointment.AppointmentDate).toLocaleString()}`;
    const html = `
        <h2>Appointment Confirmation</h2>
        <p>Dear ${patient.FirstName} ${patient.LastName},</p>
        <p>Your appointment has been confirmed for ${new Date(appointment.AppointmentDate).toLocaleString()}.</p>
        <p>Please arrive 15 minutes before your scheduled time.</p>
        <p>If you need to cancel or reschedule, please contact us at least 24 hours in advance.</p>
        <p>Best regards,<br>Dental Office Team</p>
    `;

    return sendEmail(patient.Email, subject, text, html);
};

module.exports = {
    // Appointment related
    checkAppointmentConflict,
    validateUser,
    validateDate,
    validateStatus,

    // Password related
    validatePassword,
    hashPassword,
    verifyPassword,

    // User related
    validateUserCreation,
    validateLogin,
    sanitizeUserData,
    validateEmail,

    // General utilities
    buildPaginationOptions,
    validateToken,

    // Role related
    checkRole,

    // Email related
    sendEmail,
    sendAppointmentConfirmationEmail
}; 