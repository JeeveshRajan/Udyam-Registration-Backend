"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const express_validator_1 = require("express-validator");
const validators_1 = require("../utils/validators");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
router.post('/submit', [
    (0, express_validator_1.body)('aadhaarNumber').trim().notEmpty().withMessage('Aadhaar number is required'),
    (0, express_validator_1.body)('mobileNumber').trim().notEmpty().withMessage('Mobile number is required'),
    (0, express_validator_1.body)('emailAddress').trim().isEmail().withMessage('Valid email is required'),
    (0, express_validator_1.body)('otpVerified').isBoolean().withMessage('OTP verification status is required'),
    (0, express_validator_1.body)('panNumber').trim().notEmpty().withMessage('PAN number is required'),
    (0, express_validator_1.body)('businessName').trim().notEmpty().withMessage('Business name is required'),
    (0, express_validator_1.body)('businessType').trim().notEmpty().withMessage('Business type is required'),
    (0, express_validator_1.body)('addressLine1').trim().notEmpty().withMessage('Address line 1 is required'),
    (0, express_validator_1.body)('city').trim().notEmpty().withMessage('City is required'),
    (0, express_validator_1.body)('state').trim().notEmpty().withMessage('State is required'),
    (0, express_validator_1.body)('pincode').trim().notEmpty().withMessage('PIN code is required'),
], async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }
        const { aadhaarNumber, mobileNumber, emailAddress, otpVerified, panNumber, businessName, businessType, addressLine1, addressLine2, city, state, pincode } = req.body;
        const validations = [
            { field: 'aadhaarNumber', result: (0, validators_1.validateAadhaar)(aadhaarNumber) },
            { field: 'mobileNumber', result: (0, validators_1.validateMobile)(mobileNumber) },
            { field: 'emailAddress', result: (0, validators_1.validateEmail)(emailAddress) },
            { field: 'panNumber', result: (0, validators_1.validatePAN)(panNumber) },
            { field: 'businessName', result: (0, validators_1.validateBusinessName)(businessName) },
            { field: 'businessType', result: (0, validators_1.validateBusinessType)(businessType) },
            { field: 'addressLine1', result: (0, validators_1.validateAddress)(addressLine1, 'Address line 1') },
            { field: 'city', result: (0, validators_1.validateCity)(city) },
            { field: 'state', result: (0, validators_1.validateState)(state) },
            { field: 'pincode', result: (0, validators_1.validatePincode)(pincode) }
        ];
        if (!otpVerified) {
            return res.status(400).json({
                success: false,
                message: 'OTP verification is required before form submission'
            });
        }
        const validationErrors = [];
        validations.forEach(({ field, result }) => {
            if (!result.isValid) {
                validationErrors.push({
                    field,
                    message: result.errorMessage
                });
            }
        });
        if (validationErrors.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Form validation failed',
                errors: validationErrors
            });
        }
        const existingSubmission = await prisma.formSubmission.findFirst({
            where: {
                OR: [
                    { aadhaarNumber },
                    { panNumber }
                ]
            }
        });
        if (existingSubmission) {
            return res.status(409).json({
                success: false,
                message: 'A submission with this Aadhaar number or PAN already exists'
            });
        }
        const formSubmission = await prisma.formSubmission.create({
            data: {
                aadhaarNumber,
                mobileNumber,
                emailAddress,
                otpVerified,
                panNumber,
                businessName,
                businessType,
                addressLine1,
                addressLine2: addressLine2 || null,
                city,
                state,
                pincode,
                status: 'PENDING'
            }
        });
        await prisma.validationLog.createMany({
            data: validations.map(({ field, result }) => ({
                fieldName: field,
                fieldValue: req.body[field],
                validationType: getValidationType(field),
                isValid: result.isValid,
                formSubmissionId: formSubmission.id
            }))
        });
        res.status(201).json({
            success: true,
            message: 'Form submitted successfully',
            data: {
                id: formSubmission.id,
                status: formSubmission.status,
                submittedAt: formSubmission.createdAt
            }
        });
    }
    catch (error) {
        console.error('Form submission error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error : undefined
        });
    }
});
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const formSubmission = await prisma.formSubmission.findUnique({
            where: { id },
            include: {
                validationLogs: true
            }
        });
        if (!formSubmission) {
            return res.status(404).json({
                success: false,
                message: 'Form submission not found'
            });
        }
        res.status(200).json({
            success: true,
            data: formSubmission
        });
    }
    catch (error) {
        console.error('Form retrieval error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const status = req.query.status;
        const search = req.query.search;
        const skip = (page - 1) * limit;
        const where = {};
        if (status) {
            where.status = status;
        }
        if (search) {
            where.OR = [
                { businessName: { contains: search, mode: 'insensitive' } },
                { aadhaarNumber: { contains: search } },
                { panNumber: { contains: search } },
                { mobileNumber: { contains: search } }
            ];
        }
        const [submissions, total] = await Promise.all([
            prisma.formSubmission.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    businessName: true,
                    businessType: true,
                    status: true,
                    createdAt: true,
                    aadhaarNumber: true,
                    panNumber: true
                }
            }),
            prisma.formSubmission.count({ where })
        ]);
        const totalPages = Math.ceil(total / limit);
        res.status(200).json({
            success: true,
            data: {
                submissions,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages,
                    hasNext: page < totalPages,
                    hasPrev: page > 1
                }
            }
        });
    }
    catch (error) {
        console.error('Form listing error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
router.put('/:id/status', [
    (0, express_validator_1.body)('status').isIn(['PENDING', 'APPROVED', 'REJECTED', 'UNDER_REVIEW']).withMessage('Invalid status'),
    (0, express_validator_1.body)('notes').optional().isString().withMessage('Notes must be a string')
], async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }
        const { id } = req.params;
        const { status, notes } = req.body;
        const formSubmission = await prisma.formSubmission.update({
            where: { id },
            data: {
                status,
                notes: notes || null,
                updatedAt: new Date()
            }
        });
        res.status(200).json({
            success: true,
            message: 'Status updated successfully',
            data: formSubmission
        });
    }
    catch (error) {
        console.error('Status update error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.formSubmission.update({
            where: { id },
            data: {
                status: 'REJECTED',
                notes: 'Form submission deleted',
                updatedAt: new Date()
            }
        });
        res.status(200).json({
            success: true,
            message: 'Form submission deleted successfully'
        });
    }
    catch (error) {
        console.error('Form deletion error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
function getValidationType(field) {
    const validationMap = {
        aadhaarNumber: 'aadhaar',
        panNumber: 'pan',
        mobileNumber: 'mobile',
        emailAddress: 'email',
        pincode: 'pincode',
        businessName: 'business_name',
        businessType: 'business_type',
        addressLine1: 'address',
        city: 'city',
        state: 'state'
    };
    return validationMap[field] || 'general';
}
exports.default = router;
