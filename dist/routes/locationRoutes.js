"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
const mockLocationData = {
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
router.get('/pincode/:pincode', [
    (0, express_validator_1.param)('pincode').isLength({ min: 6, max: 6 }).isNumeric()
], async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }
        const { pincode } = req.params;
        if (mockLocationData[pincode]) {
            const locationData = mockLocationData[pincode];
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
        try {
            return res.json({
                success: true,
                pincode,
                city: 'City not found',
                state: 'State not found',
                district: 'District not found',
                source: 'external_api',
                message: 'PIN code found but location details not available'
            });
        }
        catch (apiError) {
            console.error('External API error:', apiError);
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
    }
    catch (error) {
        console.error('PIN code lookup error:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error during PIN code lookup'
        });
    }
});
router.get('/cities/search', [
    (0, express_validator_1.query)('q').isString().isLength({ min: 2 })
], async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }
        const { q } = req.query;
        const searchTerm = q.toLowerCase();
        const matchingCities = Object.values(mockLocationData)
            .filter(location => location.city.toLowerCase().includes(searchTerm) ||
            location.state.toLowerCase().includes(searchTerm))
            .map(location => ({
            city: location.city,
            state: location.state,
            district: location.district
        }))
            .slice(0, 10);
        return res.json({
            success: true,
            query: searchTerm,
            results: matchingCities,
            total: matchingCities.length
        });
    }
    catch (error) {
        console.error('City search error:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error during city search'
        });
    }
});
router.get('/states', async (req, res) => {
    try {
        const states = [...new Set(Object.values(mockLocationData).map(location => location.state))];
        return res.json({
            success: true,
            states: states.sort(),
            total: states.length
        });
    }
    catch (error) {
        console.error('States fetch error:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error while fetching states'
        });
    }
});
router.get('/states/:state/cities', [
    (0, express_validator_1.param)('state').isString().notEmpty()
], async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }
        const { state } = req.params;
        const stateName = state.toLowerCase();
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
    }
    catch (error) {
        console.error('Cities by state error:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error while fetching cities by state'
        });
    }
});
router.get('/popular', async (req, res) => {
    try {
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
    }
    catch (error) {
        console.error('Popular PIN codes error:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error while fetching popular PIN codes'
        });
    }
});
exports.default = router;
