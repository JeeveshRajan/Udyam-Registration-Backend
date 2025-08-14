import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import {
  validateAadhaar,
  validatePAN,
  validateMobile,
  validateEmail,
  validatePincode,
  validateBusinessName,
  validateBusinessType,
  validateAddress,
  validateCity,
  validateState,
  validateOTP,
  ValidationResult
} from '../utils/validators';

const router = Router();
const prisma = new PrismaClient();

// Validate individual field
router.post('/field', [
  body('fieldName').isString().notEmpty(),
  body('value').isString().notEmpty(),
  body('step').isIn(['1', '2']).optional()
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { fieldName, value, step } = req.body;
    let validationResultData: ValidationResult;

    // Route to appropriate validator based on field name
    switch (fieldName.toLowerCase()) {
      case 'aadhaarnumber':
        validationResultData = validateAadhaar(value);
        break;
      case 'pannumber':
        validationResultData = validatePAN(value);
        break;
      case 'mobilenumber':
        validationResultData = validateMobile(value);
        break;
      case 'email':
        validationResultData = validateEmail(value);
        break;
      case 'pincode':
        validationResultData = validatePincode(value);
        break;
      case 'businessname':
        validationResultData = validateBusinessName(value);
        break;
      case 'businesstype':
        validationResultData = validateBusinessType(value);
        break;
      case 'address':
        validationResultData = validateAddress(value);
        break;
      case 'city':
        validationResultData = validateCity(value);
        break;
      case 'state':
        validationResultData = validateState(value);
        break;
      case 'otp':
        validationResultData = validateOTP(value);
        break;
      default:
        return res.status(400).json({
          success: false,
          error: `Unknown field: ${fieldName}`
        });
    }

    // Log validation attempt
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

  } catch (error) {
    console.error('Validation error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error during validation'
    });
  }
});

// Validate multiple fields at once
router.post('/multiple', [
  body('fields').isArray().notEmpty(),
  body('fields.*.fieldName').isString().notEmpty(),
  body('fields.*.value').isString().notEmpty(),
  body('step').isIn(['1', '2']).optional()
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { fields, step } = req.body;
    const results: Array<{
      fieldName: string;
      isValid: boolean;
      errorMessage?: string;
    }> = [];

    // Validate each field
    for (const field of fields) {
      const { fieldName, value } = field;
      let validationResultData: ValidationResult;

      switch (fieldName.toLowerCase()) {
        case 'aadhaarnumber':
          validationResultData = validateAadhaar(value);
          break;
        case 'pannumber':
          validationResultData = validatePAN(value);
          break;
        case 'mobilenumber':
          validationResultData = validateMobile(value);
          break;
        case 'email':
          validationResultData = validateEmail(value);
          break;
        case 'pincode':
          validationResultData = validatePincode(value);
          break;
        case 'businessname':
          validationResultData = validateBusinessName(value);
          break;
        case 'businesstype':
          validationResultData = validateBusinessType(value);
          break;
        case 'address':
          validationResultData = validateAddress(value);
          break;
        case 'city':
          validationResultData = validateCity(value);
          break;
        case 'state':
          validationResultData = validateState(value);
          break;
        case 'otp':
          validationResultData = validateOTP(value);
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

      // Log validation attempt
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

  } catch (error) {
    console.error('Multiple validation error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error during validation'
    });
  }
});

// Get validation statistics
router.get('/stats', async (req: Request, res: Response) => {
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
      } else {
        acc[stat.fieldName].invalid = stat._count.fieldName;
      }
      return acc;
    }, {} as Record<string, { valid: number; invalid: number }>);

    return res.json({
      success: true,
      stats: fieldStats
    });

  } catch (error) {
    console.error('Stats error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error while fetching stats'
    });
  }
});

// Get validation history for a specific field
router.get('/history/:fieldName', async (req: Request, res: Response) => {
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

  } catch (error) {
    console.error('History error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error while fetching history'
    });
  }
});

export default router;
