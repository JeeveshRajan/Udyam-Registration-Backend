"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const client_1 = require("@prisma/client");
const dotenv_1 = __importDefault(require("dotenv"));
const formRoutes_1 = __importDefault(require("./routes/formRoutes"));
const validationRoutes_1 = __importDefault(require("./routes/validationRoutes"));
const locationRoutes_1 = __importDefault(require("./routes/locationRoutes"));
const errorHandler_1 = require("./middleware/errorHandler");
const notFoundHandler_1 = require("./middleware/notFoundHandler");
dotenv_1.default.config();
const prisma = new client_1.PrismaClient();
const app = (0, express_1.default)();
const PORT = process.env['PORT'] || 3001;
const NODE_ENV = process.env['NODE_ENV'] || 'development';
const FRONTEND_URL = process.env['FRONTEND_URL'] || 'http://localhost:3000';
app.use((0, helmet_1.default)());
const limiter = (0, express_rate_limit_1.default)({
    windowMs: parseInt(process.env['RATE_LIMIT_WINDOW_MS'] || '900000'),
    max: parseInt(process.env['RATE_LIMIT_MAX_REQUESTS'] || '100'),
    message: {
        success: false,
        error: 'Too many requests from this IP, please try again later.'
    }
});
app.use(limiter);
app.use((0, cors_1.default)({
    origin: FRONTEND_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
if (NODE_ENV !== 'test') {
    app.use((0, morgan_1.default)('combined'));
}
app.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'Udyam Registration API is running',
        timestamp: new Date().toISOString(),
        environment: NODE_ENV,
        uptime: process.uptime()
    });
});
app.use('/api/forms', formRoutes_1.default);
app.use('/api/validate', validationRoutes_1.default);
app.use('/api/locations', locationRoutes_1.default);
app.use(notFoundHandler_1.notFoundHandler);
app.use(errorHandler_1.errorHandler);
const gracefulShutdown = async (signal) => {
    console.log(`\n🔄 Received ${signal}. Starting graceful shutdown...`);
    try {
        await prisma.$disconnect();
        console.log('✅ Database connection closed');
        process.exit(0);
    }
    catch (error) {
        console.error('❌ Error during graceful shutdown:', error);
        process.exit(1);
    }
};
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
const startServer = async () => {
    try {
        await prisma.$connect();
        console.log('✅ Database connected successfully');
        app.listen(PORT, () => {
            console.log(`\n🚀 Udyam Registration API Server`);
            console.log(`📍 Environment: ${NODE_ENV}`);
            console.log(`🌐 Server running on http://localhost:${PORT}`);
            console.log(`🔗 Health check: http://localhost:${PORT}/health`);
            console.log(`📊 Environment: ${NODE_ENV}`);
            console.log(`⏰ Started at: ${new Date().toISOString()}\n`);
        });
    }
    catch (error) {
        console.error('❌ Failed to start server:', error);
        if (NODE_ENV !== 'test') {
            process.exit(1);
        }
    }
};
startServer();
