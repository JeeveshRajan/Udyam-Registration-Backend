"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const errorHandler = (err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';
    console.error('Error:', {
        message: err.message,
        stack: err.stack,
        url: req.url,
        method: req.method,
        timestamp: new Date().toISOString()
    });
    const errorResponse = {
        success: false,
        error: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    };
    res.status(statusCode).json(errorResponse);
};
exports.errorHandler = errorHandler;
