require("dotenv").config();
const express = require('express')
const morgan = require('morgan')
const helmet = require('helmet')
const app = express();
const bodyParser = require("body-parser");
const cors = require('cors')


// Routes
const userRoute = require("./routes/users-route");
const appointmentRoute = require("./routes/appointments-route");
const rolesRoute = require("./routes/roles-route");
const dentistRoute = require("./routes/dentist-route");
const servicesRoute = require('./routes/services-route');

// CORS CONFIGURATION
const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        // List of allowed origins
        const allowedOrigins = [
            'http://localhost:3000',      // Local development
            'http://localhost:8080',      // Local development
            'http://localhost:5173',      // Local development
            'http://192.168.254.114:8080',
            'http://192.168.1.9:8080',
            'http://example2.com'
        ];

        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            console.log('Blocked CORS request from:', origin);
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    maxAge: 86400 // 24 hours
}

app.use(helmet())
app.use(morgan('tiny'))
app.use(bodyParser.json());
app.use(express.json({ limit: '10000mb' }));
app.use(cors(corsOptions));
app.use(bodyParser.urlencoded({ extended: false, limit: '10000mb', parameterLimit: 50000 }));

// ENDPOINTS (API CALLS) ------------------
app.use("/api/users", userRoute);
app.use("/api/appointments", appointmentRoute);
app.use("/api/roles", rolesRoute);
app.use("/api/dentists", dentistRoute);
app.use("/api/services", servicesRoute);

// END OF ENDPOINTS --------------

app.use((error, req, res, next) => {
    if (res.headersSent) {
        return next(error);
    }
    const success = error.code === 200 || error.code === 201;
    const statusCode = error.code || 500;
    console.log(error.code)
    if (error.code === 401) {
        res.status(401).json({
            message: error.message || "An unknown error occurred",
            code: error.code,
            success: success,
            logout: true,
        });
    } else {
        res.status(statusCode).json({
            message: error.message || "An unknown error occurred",
            code: statusCode,
            success: success,
        });
    }
});

module.exports = app