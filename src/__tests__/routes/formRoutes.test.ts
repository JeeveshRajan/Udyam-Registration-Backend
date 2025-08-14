import request from 'supertest'
import { Express } from 'express'
import { PrismaClient } from '@prisma/client'
import { createApp } from '../../index'

// Mock Prisma
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    formSubmission: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    validationLog: {
      create: jest.fn(),
    },
    $disconnect: jest.fn(),
  })),
}))

describe('Form Routes', () => {
  let app: Express
  let mockPrisma: jest.Mocked<PrismaClient>

  beforeEach(() => {
    jest.clearAllMocks()
    app = createApp()
    mockPrisma = new PrismaClient() as jest.Mocked<PrismaClient>
  })

  describe('POST /api/forms/submit', () => {
    const validFormData = {
      aadhaarNumber: '123456789012',
      panNumber: 'ABCDE1234F',
      mobileNumber: '9876543210',
      email: 'test@example.com',
      businessName: 'Test Business',
      businessType: 'Proprietorship',
      address: '123 Test Street',
      city: 'Test City',
      state: 'Test State',
      pincode: '123456'
    }

    it('should create a new form submission with valid data', async () => {
      const mockSubmission = { id: '1', ...validFormData, status: 'PENDING' }
      mockPrisma.formSubmission.create.mockResolvedValue(mockSubmission as any)
      mockPrisma.formSubmission.findUnique.mockResolvedValue(null) // No duplicate

      const response = await request(app)
        .post('/api/forms/submit')
        .send(validFormData)
        .expect(201)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toEqual(mockSubmission)
      expect(mockPrisma.formSubmission.create).toHaveBeenCalledWith({
        data: validFormData
      })
    })

    it('should return 400 for missing required fields', async () => {
      const incompleteData = { aadhaarNumber: '123456789012' }

      const response = await request(app)
        .post('/api/forms/submit')
        .send(incompleteData)
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.errors).toBeDefined()
    })

    it('should return 400 for invalid Aadhaar number format', async () => {
      const invalidData = { ...validFormData, aadhaarNumber: '123' }

      const response = await request(app)
        .post('/api/forms/submit')
        .send(invalidData)
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.errors).toBeDefined()
    })

    it('should return 400 for invalid PAN number format', async () => {
      const invalidData = { ...validFormData, panNumber: 'INVALID' }

      const response = await request(app)
        .post('/api/forms/submit')
        .send(invalidData)
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.errors).toBeDefined()
    })

    it('should return 400 for invalid mobile number format', async () => {
      const invalidData = { ...validFormData, mobileNumber: '1234567890' }

      const response = await request(app)
        .post('/api/forms/submit')
        .send(invalidData)
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.errors).toBeDefined()
    })

    it('should return 400 for invalid email format', async () => {
      const invalidData = { ...validFormData, email: 'invalid-email' }

      const response = await request(app)
        .post('/api/forms/submit')
        .send(invalidData)
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.errors).toBeDefined()
    })

    it('should return 400 for duplicate Aadhaar number', async () => {
      mockPrisma.formSubmission.findUnique.mockResolvedValue({ id: '1' } as any)

      const response = await request(app)
        .post('/api/forms/submit')
        .send(validFormData)
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toContain('Aadhaar number already exists')
    })

    it('should return 400 for duplicate PAN number', async () => {
      mockPrisma.formSubmission.findUnique
        .mockResolvedValueOnce(null) // First call for Aadhaar
        .mockResolvedValueOnce({ id: '1' } as any) // Second call for PAN

      const response = await request(app)
        .post('/api/forms/submit')
        .send(validFormData)
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toContain('PAN number already exists')
    })

    it('should handle database errors gracefully', async () => {
      mockPrisma.formSubmission.create.mockRejectedValue(new Error('Database error'))

      const response = await request(app)
        .post('/api/forms/submit')
        .send(validFormData)
        .expect(500)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('Internal server error')
    })
  })

  describe('GET /api/forms/:id', () => {
    it('should return a form submission by ID', async () => {
      const mockSubmission = { id: '1', aadhaarNumber: '123456789012' }
      mockPrisma.formSubmission.findUnique.mockResolvedValue(mockSubmission as any)

      const response = await request(app)
        .get('/api/forms/1')
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toEqual(mockSubmission)
    })

    it('should return 404 for non-existent submission', async () => {
      mockPrisma.formSubmission.findUnique.mockResolvedValue(null)

      const response = await request(app)
        .get('/api/forms/999')
        .expect(404)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('Form submission not found')
    })

    it('should handle database errors gracefully', async () => {
      mockPrisma.formSubmission.findUnique.mockRejectedValue(new Error('Database error'))

      const response = await request(app)
        .get('/api/forms/1')
        .expect(500)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('Internal server error')
    })
  })

  describe('GET /api/forms', () => {
    it('should return paginated form submissions', async () => {
      const mockSubmissions = [
        { id: '1', aadhaarNumber: '123456789012' },
        { id: '2', aadhaarNumber: '987654321098' }
      ]
      mockPrisma.formSubmission.findMany.mockResolvedValue(mockSubmissions as any)

      const response = await request(app)
        .get('/api/forms')
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toEqual(mockSubmissions)
      expect(response.body.pagination).toBeDefined()
    })

    it('should apply filters correctly', async () => {
      const mockSubmissions = [{ id: '1', aadhaarNumber: '123456789012' }]
      mockPrisma.formSubmission.findMany.mockResolvedValue(mockSubmissions as any)

      const response = await request(app)
        .get('/api/forms?status=PENDING&limit=10')
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(mockPrisma.formSubmission.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: 'PENDING' },
          take: 10
        })
      )
    })

    it('should handle database errors gracefully', async () => {
      mockPrisma.formSubmission.findMany.mockRejectedValue(new Error('Database error'))

      const response = await request(app)
        .get('/api/forms')
        .expect(500)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('Internal server error')
    })
  })

  describe('PUT /api/forms/:id/status', () => {
    it('should update form submission status', async () => {
      const mockSubmission = { id: '1', status: 'APPROVED' }
      mockPrisma.formSubmission.update.mockResolvedValue(mockSubmission as any)

      const response = await request(app)
        .put('/api/forms/1/status')
        .send({ status: 'APPROVED' })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.status).toBe('APPROVED')
    })

    it('should return 400 for invalid status', async () => {
      const response = await request(app)
        .put('/api/forms/1/status')
        .send({ status: 'INVALID_STATUS' })
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('Invalid status value')
    })

    it('should return 404 for non-existent submission', async () => {
      mockPrisma.formSubmission.update.mockRejectedValue(new Error('Record not found'))

      const response = await request(app)
        .put('/api/forms/999/status')
        .send({ status: 'APPROVED' })
        .expect(404)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('Form submission not found')
    })
  })

  describe('DELETE /api/forms/:id', () => {
    it('should soft delete a form submission', async () => {
      const mockSubmission = { id: '1', deletedAt: new Date() }
      mockPrisma.formSubmission.update.mockResolvedValue(mockSubmission as any)

      const response = await request(app)
        .delete('/api/forms/1')
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.message).toBe('Form submission deleted successfully')
    })

    it('should return 404 for non-existent submission', async () => {
      mockPrisma.formSubmission.update.mockRejectedValue(new Error('Record not found'))

      const response = await request(app)
        .delete('/api/forms/999')
        .expect(404)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('Form submission not found')
    })
  })
})

// Helper function to create app for testing
function createApp(): Express {
  const express = require('express')
  const app = express()
  
  app.use(express.json())
  
  // Mock the routes
  const formRoutes = require('../../routes/formRoutes')
  app.use('/api/forms', formRoutes)
  
  return app
}
