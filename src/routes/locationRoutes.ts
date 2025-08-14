import { Router, Request, Response } from 'express';
import { param, query, validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Mock location data - in production, you'd use a real API like PostPin
const mockLocationData: Record<string, { city: string; state: string; district: string }> = {
  '110001': { city: 'New Delhi', state: 'Delhi', district: 'New Delhi' },
  '400001': { city: 'Mumbai', state: 'Maharashtra', district: 'Mumbai City' },
  '700001': { city: 'Kolkata', state: 'West Bengal', district: 'Kolkata' },
  '600001': { city: 'Chennai', state: 'Tamil Nadu', district: 'Chennai' },
  '500001': { city: 'Hyderabad', state: 'Telangana', district: 'Hyderabad' },
  '560001': { city: 'Bangalore', state: 'Karnataka', district: 'Bangalore Urban' },
  '380001': { city: 'Ahmedabad', state: 'Gujarat', district: 'Ahmedabad' },
  '302001': { city: 'Jaipur', state: 'Rajasthan', district: 'Jaipur' },
  '226001': { city: 'Lucknow', state: 'Uttar Pradesh', district: 'Lucknow' },
  '800001': { city: 'Patna', state: 'Bihar', district: 'Patna' }
};

// Get city and state by PIN code
router.get('/pincode/:pincode', [
  param('pincode').isLength({ min: 6, max: 6 }).isNumeric()
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { pincode } = req.params;

    // Check if we have mock data for this PIN code
    if (mockLocationData[pincode]) {
      const locationData = mockLocationData[pincode];
      
      // Log the successful lookup
      await prisma.validationLog.create({
        data: {
          fieldName: 'pincode_lookup',
          fieldValue: pincode,
          validationType: 'pincode_lookup',
          isValid: true,
          errorMessage: null
        }
      });

      return res.json({
        success: true,
        pincode,
        city: locationData.city,
        state: locationData.state,
        district: locationData.district,
        source: 'mock_data'
      });
    }

    // If no mock data, try to fetch from external API (PostPin or similar)
    try {
      // This would be your actual API call to PostPin or similar service
      // const response = await fetch(`https://api.postpin.com/v1/pincode/${pincode}`);
      // const data = await response.json();
      
      // For now, return a generic response
      return res.json({
        success: true,
        pincode,
        city: 'City not found',
        state: 'State not found',
        district: 'District not found',
        source: 'external_api',
        message: 'PIN code found but location details not available'
      });
    } catch (apiError) {
      console.error('External API error:', apiError);
      
      // Log the failed lookup
      await prisma.validationLog.create({
        data: {
          fieldName: 'pincode_lookup',
          fieldValue: pincode,
          validationType: 'pincode_lookup',
          isValid: false,
          errorMessage: 'PIN code not found in database'
        }
      });

      return res.status(404).json({
        success: false,
        error: 'PIN code not found',
        pincode
      });
    }

  } catch (error) {
    console.error('PIN code lookup error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error during PIN code lookup'
    });
  }
});

// Search cities by name (autocomplete)
router.get('/cities/search', [
  query('q').isString().isLength({ min: 2 })
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { q } = req.query;
    const searchTerm = (q as string).toLowerCase();

    // Filter cities from mock data that match the search term
    const matchingCities = Object.values(mockLocationData)
      .filter(location => 
        location.city.toLowerCase().includes(searchTerm) ||
        location.state.toLowerCase().includes(searchTerm)
      )
      .map(location => ({
        city: location.city,
        state: location.state,
        district: location.district
      }))
      .slice(0, 10); // Limit to 10 results

    return res.json({
      success: true,
      query: searchTerm,
      results: matchingCities,
      total: matchingCities.length
    });

  } catch (error) {
    console.error('City search error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error during city search'
    });
  }
});

// Get all states
router.get('/states', async (req: Request, res: Response) => {
  try {
    // Extract unique states from mock data
    const states = [...new Set(Object.values(mockLocationData).map(location => location.state))];
    
    return res.json({
      success: true,
      states: states.sort(),
      total: states.length
    });

  } catch (error) {
    console.error('States fetch error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error while fetching states'
    });
  }
});

// Get cities by state
router.get('/states/:state/cities', [
  param('state').isString().notEmpty()
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { state } = req.params;
    const stateName = state.toLowerCase();

    // Filter cities by state
    const citiesInState = Object.values(mockLocationData)
      .filter(location => location.state.toLowerCase() === stateName)
      .map(location => ({
        city: location.city,
        district: location.district
      }));

    return res.json({
      success: true,
      state,
      cities: citiesInState,
      total: citiesInState.length
    });

  } catch (error) {
    console.error('Cities by state error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error while fetching cities by state'
    });
  }
});

// Get popular PIN codes (most searched)
router.get('/popular', async (req: Request, res: Response) => {
  try {
    // For now, return some popular PIN codes
    // In production, you'd query the validation log to see which PIN codes are searched most
    const popularPincodes = [
      { pincode: '110001', city: 'New Delhi', state: 'Delhi' },
      { pincode: '400001', city: 'Mumbai', state: 'Maharashtra' },
      { pincode: '700001', city: 'Kolkata', state: 'West Bengal' },
      { pincode: '600001', city: 'Chennai', state: 'Tamil Nadu' },
      { pincode: '500001', city: 'Hyderabad', state: 'Telangana' }
    ];

    return res.json({
      success: true,
      popularPincodes,
      total: popularPincodes.length
    });

  } catch (error) {
    console.error('Popular PIN codes error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error while fetching popular PIN codes'
    });
  }
});

export default router;
