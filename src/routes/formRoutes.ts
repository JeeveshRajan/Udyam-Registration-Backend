import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { body, validationResult } from 'express-validator';
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
  validateOTP
} from '../utils/validators';

const router = Router();
const prisma = new PrismaClient();

/**
 * POST /api/forms/submit
 * Submit complete Udyam registration form
 */
router.post('/submit', [
  // Step 1: Aadhaar + OTP Validation
  body('aadhaarNumber').trim().notEmpty().withMessage('Aadhaar number is required'),
  body('mobileNumber').trim().notEmpty().withMessage('Mobile number is required'),
  body('emailAddress').trim().isEmail().withMessage('Valid email is required'),
  body('otpVerified').isBoolean().withMessage('OTP verification status is required'),
  
  // Step 2: PAN Validation
  body('panNumber').trim().notEmpty().withMessage('PAN number is required'),
  body('businessName').trim().notEmpty().withMessage('Business name is required'),
  body('businessType').trim().notEmpty().withMessage('Business type is required'),
  body('addressLine1').trim().notEmpty().withMessage('Address line 1 is required'),
  body('city').trim().notEmpty().withMessage('City is required'),
  body('state').trim().notEmpty().withMessage('State is required'),
  body('pincode').trim().notEmpty().withMessage('PIN code is required'),
], async (req: Request, res: Response) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const {
      aadhaarNumber,
      mobileNumber,
      emailAddress,
      otpVerified,
      panNumber,
      businessName,
      businessType,
      addressLine1,
      addressLine2,
      city,
      state,
      pincode
    } = req.body;

    // Validate all fields using custom validators
    const validations = [
      { field: 'aadhaarNumber', result: validateAadhaar(aadhaarNumber) },
      { field: 'mobileNumber', result: validateMobile(mobileNumber) },
      { field: 'emailAddress', result: validateEmail(emailAddress) },
      { field: 'panNumber', result: validatePAN(panNumber) },
      { field: 'businessName', result: validateBusinessName(businessName) },
      { field: 'businessType', result: validateBusinessType(businessType) },
      { field: 'addressLine1', result: validateAddress(addressLine1, 'Address line 1') },
      { field: 'city', result: validateCity(city) },
      { field: 'state', result: validateState(state) },
      { field: 'pincode', result: validatePincode(pincode) }
    ];

    // Check if OTP is verified
    if (!otpVerified) {
      return res.status(400).json({
        success: false,
        message: 'OTP verification is required before form submission'
      });
    }

    // Collect validation errors
    const validationErrors: any[] = [];
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

    // Check if Aadhaar or PAN already exists
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

    // Create form submission
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

    // Log validation success
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

  } catch (error) {
    console.error('Form submission error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
});

/**
 * GET /api/forms/:id
 * Retrieve form submission by ID
 */
router.get('/:id', async (req: Request, res: Response) => {
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

  } catch (error) {
    console.error('Form retrieval error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * GET /api/forms
 * List all form submissions with pagination
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as string;
    const search = req.query.search as string;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
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

  } catch (error) {
    console.error('Form listing error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * PUT /api/forms/:id/status
 * Update form submission status
 */
router.put('/:id/status', [
  body('status').isIn(['PENDING', 'APPROVED', 'REJECTED', 'UNDER_REVIEW']).withMessage('Invalid status'),
  body('notes').optional().isString().withMessage('Notes must be a string')
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
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

  } catch (error) {
    console.error('Status update error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * DELETE /api/forms/:id
 * Delete form submission (soft delete by updating status)
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Soft delete by updating status
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

  } catch (error) {
    console.error('Form deletion error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * Helper function to determine validation type for logging
 */
function getValidationType(field: string): string {
  const validationMap: { [key: string]: string } = {
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

export default router;
