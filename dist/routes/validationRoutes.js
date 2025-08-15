"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const client_1 = require("@prisma/client");
const validators_1 = require("../utils/validators");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
router.post('/field', [
    (0, express_validator_1.body)('fieldName').isString().notEmpty(),
    (0, express_validator_1.body)('value').isString().notEmpty(),
    (0, express_validator_1.body)('step').isIn(['1', '2']).optional()
], async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }
        const { fieldName, value, step } = req.body;
        let validationResultData;
        switch (fieldName.toLowerCase()) {
            case 'aadhaarnumber':
                validationResultData = (0, validators_1.validateAadhaar)(value);
                break;
            case 'pannumber':
                validationResultData = (0, validators_1.validatePAN)(value);
                break;
            case 'mobilenumber':
                validationResultData = (0, validators_1.validateMobile)(value);
                break;
            case 'email':
                validationResultData = (0, validators_1.validateEmail)(value);
                break;
            case 'pincode':
                validationResultData = (0, validators_1.validatePincode)(value);
                break;
            case 'businessname':
                validationResultData = (0, validators_1.validateBusinessName)(value);
                break;
            case 'businesstype':
                validationResultData = (0, validators_1.validateBusinessType)(value);
                break;
            case 'address':
                validationResultData = (0, validators_1.validateAddress)(value);
                break;
            case 'city':
                validationResultData = (0, validators_1.validateCity)(value);
                break;
            case 'state':
                validationResultData = (0, validators_1.validateState)(value);
                break;
            case 'otp':
                validationResultData = (0, validators_1.validateOTP)(value);
                break;
            default:
                return res.status(400).json({
                    success: false,
                    error: `Unknown field: ${fieldName}`
                });
        }
        await prisma.validationLog.create({
            data: {
                fieldName,
                fieldValue: value,
                validationType: fieldName.toLowerCase(),
                isValid: validationResultData.isValid,
                errorMessage: validationResultData.errorMessage || null
            }
        });
        return res.json({
            success: true,
            fieldName,
            isValid: validationResultData.isValid,
            errorMessage: validationResultData.errorMessage,
            step: step || '1'
        });
    }
    catch (error) {
        console.error('Validation error:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error during validation'
        });
    }
});
router.post('/multiple', [
    (0, express_validator_1.body)('fields').isArray().notEmpty(),
    (0, express_validator_1.body)('fields.*.fieldName').isString().notEmpty(),
    (0, express_validator_1.body)('fields.*.value').isString().notEmpty(),
    (0, express_validator_1.body)('step').isIn(['1', '2']).optional()
], async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }
        const { fields, step } = req.body;
        const results = [];
        for (const field of fields) {
            const { fieldName, value } = field;
            let validationResultData;
            switch (fieldName.toLowerCase()) {
                case 'aadhaarnumber':
                    validationResultData = (0, validators_1.validateAadhaar)(value);
                    break;
                case 'pannumber':
                    validationResultData = (0, validators_1.validatePAN)(value);
                    break;
                case 'mobilenumber':
                    validationResultData = (0, validators_1.validateMobile)(value);
                    break;
                case 'email':
                    validationResultData = (0, validators_1.validateEmail)(value);
                    break;
                case 'pincode':
                    validationResultData = (0, validators_1.validatePincode)(value);
                    break;
                case 'businessname':
                    validationResultData = (0, validators_1.validateBusinessName)(value);
                    break;
                case 'businesstype':
                    validationResultData = (0, validators_1.validateBusinessType)(value);
                    break;
                case 'address':
                    validationResultData = (0, validators_1.validateAddress)(value);
                    break;
                case 'city':
                    validationResultData = (0, validators_1.validateCity)(value);
                    break;
                case 'state':
                    validationResultData = (0, validators_1.validateState)(value);
                    break;
                case 'otp':
                    validationResultData = (0, validators_1.validateOTP)(value);
                    break;
                default:
                    results.push({
                        fieldName,
                        isValid: false,
                        errorMessage: `Unknown field: ${fieldName}`
                    });
                    continue;
            }
            results.push({
                fieldName,
                isValid: validationResultData.isValid,
                errorMessage: validationResultData.errorMessage
            });
            await prisma.validationLog.create({
                data: {
                    fieldName,
                    fieldValue: value,
                    validationType: fieldName.toLowerCase(),
                    isValid: validationResultData.isValid,
                    errorMessage: validationResultData.errorMessage || null
                }
            });
        }
        const overallValid = results.every(r => r.isValid);
        return res.json({
            success: true,
            overallValid,
            results,
            step: step || '1'
        });
    }
    catch (error) {
        console.error('Multiple validation error:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error during validation'
        });
    }
});
router.get('/stats', async (req, res) => {
    try {
        const stats = await prisma.validationLog.groupBy({
            by: ['fieldName', 'isValid'],
            _count: {
                fieldName: true
            }
        });
        const fieldStats = stats.reduce((acc, stat) => {
            if (!acc[stat.fieldName]) {
                acc[stat.fieldName] = { valid: 0, invalid: 0 };
            }
            if (stat.isValid) {
                acc[stat.fieldName].valid = stat._count.fieldName;
            }
            else {
                acc[stat.fieldName].invalid = stat._count.fieldName;
            }
            return acc;
        }, {});
        return res.json({
            success: true,
            stats: fieldStats
        });
    }
    catch (error) {
        console.error('Stats error:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error while fetching stats'
        });
    }
});
router.get('/history/:fieldName', async (req, res) => {
    try {
        const { fieldName } = req.params;
        const { limit = 50, offset = 0 } = req.query;
        const history = await prisma.validationLog.findMany({
            where: {
                fieldName: fieldName.toLowerCase()
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: Number(limit),
            skip: Number(offset)
        });
        return res.json({
            success: true,
            fieldName,
            history,
            total: history.length
        });
    }
    catch (error) {
        console.error('History error:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error while fetching history'
        });
    }
});
exports.default = router;
//# sourceMappingURL=validationRoutes.js.map