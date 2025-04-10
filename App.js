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


const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        // List of allowed origins
        const allowedOrigins = [
            'http://localhost:3000',      // Local development
            'http://localhost:8080',      // Local development
            'http://localhost:5173',      // Local development
            'http://dental-frontend.s3-website-ap-southeast-1.amazonaws.com',

        ];

        // Check if the origin matches any of the allowed origins
        if (allowedOrigins.indexOf(origin) !== -1 || origin.includes('dental-frontend.s3-website-ap-southeast-1.amazonaws.com')) {
            callback(null, true);
        } else {
            // callback(null, true);
            console.log('Blocked CORS request from:', origin);
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
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