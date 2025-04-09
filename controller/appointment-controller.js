const { Appointment, User, Service, UserRole } = require("../models");
const { Op } = require("sequelize");
const { sendAppointmentConfirmationEmail } = require("../middleware/Middleware");

module.exports = {
    // Create a new appointment
    createAppointment: async (req, res) => {
        try {
            const { appointmentDate, patientUserId, dentistUserId, serviceId, notes } = req.body;

            if (!appointmentDate || !patientUserId || !dentistUserId || !serviceId) {
                return res.status(400).json({
                    success: false,
                    message: 'Appointment date, patient ID, dentist ID, and service ID are required'
                });
            }

            // Check if both users exist
            const [patient, dentist, service] = await Promise.all([
                User.findByPk(patientUserId),
                User.findByPk(dentistUserId),
                Service.findByPk(serviceId)
            ]);

            if (!patient || !dentist || !service) {
                return res.status(404).json({
                    success: false,
                    message: 'Patient, dentist, or service not found'
                });
            }


            // Create the appointment
            const appointment = await Appointment.create({
                AppointmentDate: appointmentDate,
                PatientUserId: patientUserId,
                DentistUserId: dentistUserId,
                ServiceId: serviceId,
                Notes: notes,
                Status: 'P'
            });

            res.status(201).json({
                success: true,
                data: appointment
            });
        } catch (error) {
            console.error('Error creating appointment:', error);
            res.status(500).json({
                success: false,
                message: 'Error creating appointment',
                error: error.message
            });
        }
    },

    // Get all appointments with optional filters
    getAllAppointments: async (req, res) => {
        try {
            const { id } = req.params;

            if (!id) {
                return res.status(400).json({
                    success: false,
                    message: 'User ID is required'
                });
            }

            // First, check the user's role
            const user = await User.findOne({
                where: { UserId: id },
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

            if (!user.role) {
                return res.status(400).json({
                    success: false,
                    message: 'User role not found'
                });
            }

            // Determine the where clause based on role
            let whereClause = {};
            if (user.role.RoleId === 1) { // Dentist
                whereClause = { DentistUserId: id };
            } else if (user.role.RoleId === 2) { // Patient
                whereClause = { PatientUserId: id };
            } else {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid user role'
                });
            }

            const appointments = await Appointment.findAll({
                where: whereClause,
                include: [
                    {
                        model: User,
                        as: 'patient',
                        attributes: ['UserId', 'FirstName', 'LastName', 'Email', 'Phone', 'Gender', 'BirthDate']
                    },
                    {
                        model: User,
                        as: 'dentist',
                        attributes: ['UserId', 'FirstName', 'LastName', 'Email']
                    },
                    {
                        model: Service,
                        as: 'service',
                        attributes: ['ServiceId', 'Description']
                    }
                ],
                order: [['AppointmentDate', 'ASC']]
            });

            res.json({
                success: true,
                data: appointments.map(appointment => ({
                    appointmentId: appointment.AppointmentId,
                    appointmentDate: appointment.AppointmentDate,
                    patientUserId: appointment.PatientUserId,
                    dentistUserId: appointment.DentistUserId,
                    serviceId: appointment.ServiceId,
                    notes: appointment.Notes,
                    status: appointment.Status,
                    patient: appointment.patient ? {
                        userId: appointment.patient.UserId,
                        firstName: appointment.patient.FirstName,
                        lastName: appointment.patient.LastName,
                        email: appointment.patient.Email,
                        phone: appointment.patient.Phone,
                        gender: appointment.patient.Gender,
                        birthDate: appointment.patient.BirthDate
                    } : null,
                    dentist: appointment.dentist ? {
                        userId: appointment.dentist.UserId,
                        firstName: appointment.dentist.FirstName,
                        lastName: appointment.dentist.LastName,
                        email: appointment.dentist.Email
                    } : null,
                    service: appointment.service ? {
                        serviceId: appointment.service.ServiceId,
                        description: appointment.service.Description
                    } : null
                }))
            });
        } catch (error) {
            console.error('Get all appointments error:', error);
            res.status(500).json({
                success: false,
                message: 'Error retrieving appointments',
                error: error.message
            });
        }
    },

    // Get appointments for a specific date and user
    getAppointmentsByDateAndUser: async (req, res) => {
        try {
            const { date, userId } = req.params;

            if (!date || !userId) {
                return res.status(400).json({ error: "Date and userId are required" });
            }

            const startDate = new Date(date);
            startDate.setHours(0, 0, 0, 0);
            const endDate = new Date(date);
            endDate.setHours(23, 59, 59, 999);

            const appointments = await Appointment.findAll({
                where: {
                    [Op.or]: [
                        { PatientUserId: userId },
                        { DentistUserId: userId }
                    ],
                    AppointmentDate: {
                        [Op.between]: [startDate, endDate]
                    }
                },
                include: [
                    {
                        model: User,
                        as: 'patient',
                        attributes: ['UserId', 'FirstName', 'LastName', 'Email']
                    },
                    {
                        model: User,
                        as: 'dentist',
                        attributes: ['UserId', 'FirstName', 'LastName', 'Email']
                    }
                ],
                order: [['AppointmentDate', 'ASC']]
            });

            res.json({
                success: true,
                data: appointments
            });
        } catch (error) {
            console.error('Get appointments by date error:', error);
            res.status(500).json({ error: error.message });
        }
    },

    // Get a single appointment
    getAppointment: async (req, res) => {
        try {
            const { id } = req.params;
            const appointment = await Appointment.findByPk(id, {
                include: [
                    {
                        model: User,
                        as: 'patient',
                        attributes: ['UserId', 'FirstName', 'LastName', 'Email', 'Phone', 'Gender', 'BirthDate']
                    },
                    {
                        model: User,
                        as: 'dentist',
                        attributes: ['UserId', 'FirstName', 'LastName', 'Email']
                    },
                    {
                        model: Service,
                        as: 'service',
                        attributes: ['ServiceId', 'Description']
                    }
                ]
            });

            if (!appointment) {
                return res.status(404).json({
                    success: false,
                    message: "Appointment not found"
                });
            }

            res.json({
                success: true,
                data: {
                    appointmentId: appointment.AppointmentId,
                    appointmentDate: appointment.AppointmentDate,
                    patientUserId: appointment.PatientUserId,
                    dentistUserId: appointment.DentistUserId,
                    serviceId: appointment.ServiceId,
                    notes: appointment.Notes,
                    status: appointment.Status,
                    patient: appointment.patient ? {
                        userId: appointment.patient.UserId,
                        firstName: appointment.patient.FirstName,
                        lastName: appointment.patient.LastName,
                        email: appointment.patient.Email,
                        phone: appointment.patient.Phone,
                        gender: appointment.patient.Gender,
                        birthDate: appointment.patient.BirthDate
                    } : null,
                    dentist: appointment.dentist ? {
                        userId: appointment.dentist.UserId,
                        firstName: appointment.dentist.FirstName,
                        lastName: appointment.dentist.LastName,
                        email: appointment.dentist.Email
                    } : null,
                    service: appointment.service ? {
                        serviceId: appointment.service.ServiceId,
                        description: appointment.service.Description
                    } : null
                }
            });
        } catch (error) {
            console.error('Get appointment error:', error);
            res.status(500).json({
                success: false,
                message: 'Error retrieving appointment',
                error: error.message
            });
        }
    },

    // Update an appointment
    updateAppointment: async (req, res) => {
        try {
            const { id } = req.params;
            const { appointmentDate, status, serviceId, notes } = req.body;

            const appointment = await Appointment.findByPk(id, {
                include: [
                    {
                        model: User,
                        as: 'patient',
                        attributes: ['UserId', 'FirstName', 'LastName', 'Email', 'Phone', 'Gender', 'BirthDate']
                    },
                    {
                        model: User,
                        as: 'dentist',
                        attributes: ['UserId', 'FirstName', 'LastName', 'Email']
                    },
                    {
                        model: Service,
                        as: 'service',
                        attributes: ['ServiceId', 'Description']
                    }
                ]
            });

            if (!appointment) {
                return res.status(404).json({
                    success: false,
                    message: "Appointment not found"
                });
            }

            // Store the old status for comparison
            const oldStatus = appointment.Status;

            await appointment.update({
                AppointmentDate: appointmentDate || appointment.AppointmentDate,
                Status: status !== undefined ? status : appointment.Status,
                ServiceId: serviceId || appointment.ServiceId,
                Notes: notes || appointment.Notes
            });

            // If status was changed to 'C' (Confirmed), send confirmation email
            if (status === 'C' && oldStatus !== 'C' && appointment.patient) {
                try {
                    sendAppointmentConfirmationEmail(appointment, appointment.patient);
                } catch (emailError) {
                    console.error('Error sending confirmation email:', emailError);
                    // Don't fail the request if email fails
                }
            }

            // Fetch the updated appointment with all related data
            const updatedAppointment = await Appointment.findByPk(id, {
                include: [
                    {
                        model: User,
                        as: 'patient',
                        attributes: ['UserId', 'FirstName', 'LastName', 'Email', 'Phone', 'Gender', 'BirthDate']
                    },
                    {
                        model: User,
                        as: 'dentist',
                        attributes: ['UserId', 'FirstName', 'LastName', 'Email']
                    },
                    {
                        model: Service,
                        as: 'service',
                        attributes: ['ServiceId', 'Description']
                    }
                ]
            });

            res.json({
                success: true,
                data: {
                    appointmentId: updatedAppointment.AppointmentId,
                    appointmentDate: updatedAppointment.AppointmentDate,
                    patientUserId: updatedAppointment.PatientUserId,
                    dentistUserId: updatedAppointment.DentistUserId,
                    serviceId: updatedAppointment.ServiceId,
                    notes: updatedAppointment.Notes,
                    status: updatedAppointment.Status,
                    patient: updatedAppointment.patient ? {
                        userId: updatedAppointment.patient.UserId,
                        firstName: updatedAppointment.patient.FirstName,
                        lastName: updatedAppointment.patient.LastName,
                        email: updatedAppointment.patient.Email,
                        phone: updatedAppointment.patient.Phone,
                        gender: updatedAppointment.patient.Gender,
                        birthDate: updatedAppointment.patient.BirthDate
                    } : null,
                    dentist: updatedAppointment.dentist ? {
                        userId: updatedAppointment.dentist.UserId,
                        firstName: updatedAppointment.dentist.FirstName,
                        lastName: updatedAppointment.dentist.LastName,
                        email: updatedAppointment.dentist.Email
                    } : null,
                    service: updatedAppointment.service ? {
                        serviceId: updatedAppointment.service.ServiceId,
                        description: updatedAppointment.service.Description
                    } : null
                }
            });
        } catch (error) {
            console.error('Update appointment error:', error);
            res.status(500).json({
                success: false,
                message: 'Error updating appointment',
                error: error.message
            });
        }
    },

    // Delete an appointment
    deleteAppointment: async (req, res) => {
        try {
            const { id } = req.params;
            const appointment = await Appointment.findByPk(id);

            if (!appointment) {
                return res.status(404).json({
                    success: false,
                    message: "Appointment not found"
                });
            }

            await appointment.destroy();
            res.json({
                success: true,
                message: "Appointment deleted successfully"
            });
        } catch (error) {
            console.error('Delete appointment error:', error);
            res.status(500).json({
                success: false,
                message: 'Error deleting appointment',
                error: error.message
            });
        }
    }
}; 