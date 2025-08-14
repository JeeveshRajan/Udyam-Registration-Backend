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
} from '../utils/validators';

describe('Validation Utilities', () => {
  describe('validateAadhaar', () => {
    it('should validate correct Aadhaar numbers', () => {
      const validAadhaars = [
        '123456789012',
        '987654321098',
        '456789123456',
      ];

      validAadhaars.forEach(aadhaar => {
        const result = validateAadhaar(aadhaar);
        expect(result.isValid).toBe(true);
        expect(result.errorMessage).toBeUndefined();
      });
    });

    it('should reject invalid Aadhaar numbers', () => {
      const invalidAadhaars = [
        { value: '', expected: 'Aadhaar number is required' },
        { value: '12345678901', expected: 'Aadhaar number must be exactly 12 digits' },
        { value: '1234567890123', expected: 'Aadhaar number must be exactly 12 digits' },
        { value: '12345678901a', expected: 'Aadhaar number must be exactly 12 digits' },
        { value: '111111111111', expected: 'Invalid Aadhaar number' },
        { value: '000000000000', expected: 'Invalid Aadhaar number' },
      ];

      invalidAadhaars.forEach(({ value, expected }) => {
        const result = validateAadhaar(value);
        expect(result.isValid).toBe(false);
        expect(result.errorMessage).toBe(expected);
      });
    });

    it('should handle Aadhaar numbers with spaces and hyphens', () => {
      const result = validateAadhaar('1234-5678-9012');
      expect(result.isValid).toBe(true);
    });
  });

  describe('validatePAN', () => {
    it('should validate correct PAN numbers', () => {
      const validPANs = [
        'ABCDE1234F',
        'WXYZA5678B',
        'PQRST9012C',
        'MNOPQ3456D',
      ];

      validPANs.forEach(pan => {
        const result = validatePAN(pan);
        expect(result.isValid).toBe(true);
        expect(result.errorMessage).toBeUndefined();
      });
    });

    it('should reject invalid PAN numbers', () => {
      const invalidPANs = [
        { value: '', expected: 'PAN number is required' },
        { value: 'ABCD1234F', expected: 'PAN must be in format: ABCDE1234F (5 letters + 4 digits + 1 letter)' },
        { value: 'ABCDE12345', expected: 'PAN must be in format: ABCDE1234F (5 letters + 4 digits + 1 letter)' },
        { value: 'ABCDE1234', expected: 'PAN must be in format: ABCDE1234F (5 letters + 4 digits + 1 letter)' },
        { value: '12345ABCDE', expected: 'PAN must be in format: ABCDE1234F (5 letters + 4 digits + 1 letter)' },
        { value: 'AAAAA1111A', expected: 'Invalid PAN number' },
        { value: '1111111111', expected: 'PAN must be in format: ABCDE1234F (5 letters + 4 digits + 1 letter)' },
      ];

      invalidPANs.forEach(({ value, expected }) => {
        const result = validatePAN(value);
        expect(result.isValid).toBe(false);
        expect(result.errorMessage).toBe(expected);
      });
    });

    it('should convert lowercase PAN to uppercase', () => {
      const result = validatePAN('abcde1234f');
      expect(result.isValid).toBe(true);
    });
  });

  describe('validateMobile', () => {
    it('should validate correct mobile numbers', () => {
      const validMobiles = [
        '9876543210',
        '8765432109',
        '7654321098',
        '6543210987',
        '9876543210',
      ];

      validMobiles.forEach(mobile => {
        const result = validateMobile(mobile);
        expect(result.isValid).toBe(true);
        expect(result.errorMessage).toBeUndefined();
      });
    });

    it('should reject invalid mobile numbers', () => {
      const invalidMobiles = [
        { value: '', expected: 'Mobile number is required' },
        { value: '1234567890', expected: 'Mobile number must be 10 digits starting with 6, 7, 8, or 9' },
        { value: '123456789', expected: 'Mobile number must be 10 digits starting with 6, 7, 8, or 9' },
        { value: '12345678901', expected: 'Mobile number must be 10 digits starting with 6, 7, 8, or 9' },
        { value: '123456789a', expected: 'Mobile number must be 10 digits starting with 6, 7, 8, or 9' },
        { value: '0123456789', expected: 'Mobile number must be 10 digits starting with 6, 7, 8, or 9' },
        { value: '1234567890', expected: 'Mobile number must be 10 digits starting with 6, 7, 8, or 9' },
      ];

      invalidMobiles.forEach(({ value, expected }) => {
        const result = validateMobile(value);
        expect(result.isValid).toBe(false);
        expect(result.errorMessage).toBe(expected);
      });
    });

    it('should handle mobile numbers with spaces, hyphens, and plus sign', () => {
      const result = validateMobile('+91-98765-43210');
      expect(result.isValid).toBe(true);
    });
  });

  describe('validateEmail', () => {
    it('should validate correct email addresses', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'user+tag@example.org',
        'user123@test-domain.com',
      ];

      validEmails.forEach(email => {
        const result = validateEmail(email);
        expect(result.isValid).toBe(true);
        expect(result.errorMessage).toBeUndefined();
      });
    });

    it('should reject invalid email addresses', () => {
      const invalidEmails = [
        { value: '', expected: 'Email address is required' },
        { value: 'invalid-email', expected: 'Please enter a valid email address' },
        { value: '@example.com', expected: 'Please enter a valid email address' },
        { value: 'user@', expected: 'Please enter a valid email address' },
        { value: 'user@.com', expected: 'Please enter a valid email address' },
        { value: 'user..name@example.com', expected: 'Please enter a valid email address' },
      ];

      invalidEmails.forEach(({ value, expected }) => {
        const result = validateEmail(value);
        expect(result.isValid).toBe(false);
        expect(result.errorMessage).toBe(expected);
      });
    });

    it('should reject disposable email domains', () => {
      const disposableEmails = [
        'test@tempmail.org',
        'user@guerrillamail.com',
        'temp@10minutemail.com',
      ];

      disposableEmails.forEach(email => {
        const result = validateEmail(email);
        expect(result.isValid).toBe(false);
        expect(result.errorMessage).toBe('Disposable email addresses are not allowed');
      });
    });
  });

  describe('validatePincode', () => {
    it('should validate correct PIN codes', () => {
      const validPincodes = [
        '123456',
        '654321',
        '987654',
        '456789',
      ];

      validPincodes.forEach(pincode => {
        const result = validatePincode(pincode);
        expect(result.isValid).toBe(true);
        expect(result.errorMessage).toBeUndefined();
      });
    });

    it('should reject invalid PIN codes', () => {
      const invalidPincodes = [
        { value: '', expected: 'PIN code is required' },
        { value: '12345', expected: 'PIN code must be exactly 6 digits' },
        { value: '1234567', expected: 'PIN code must be exactly 6 digits' },
        { value: '12345a', expected: 'PIN code must be exactly 6 digits' },
        { value: '111111', expected: 'Invalid PIN code' },
        { value: '000000', expected: 'Invalid PIN code' },
      ];

      invalidPincodes.forEach(({ value, expected }) => {
        const result = validatePincode(value);
        expect(result.isValid).toBe(false);
        expect(result.errorMessage).toBe(expected);
      });
    });

    it('should handle PIN codes with spaces', () => {
      const result = validatePincode('123 456');
      expect(result.isValid).toBe(true);
    });
  });

  describe('validateBusinessName', () => {
    it('should validate correct business names', () => {
      const validNames = [
        'ABC Company',
        'Tech Solutions Ltd.',
        'Restaurant & Bar',
        'Consulting Services',
        'A', // Minimum length
      ];

      validNames.forEach(name => {
        const result = validateBusinessName(name);
        expect(result.isValid).toBe(true);
        expect(result.errorMessage).toBeUndefined();
      });
    });

    it('should reject invalid business names', () => {
      const invalidNames = [
        { value: '', expected: 'Business name is required' },
        { value: 'A', expected: 'Business name must be at least 2 characters long' },
        { value: 'A'.repeat(101), expected: 'Business name must be less than 100 characters' },
        { value: 'Company@#$%', expected: 'Business name contains invalid characters' },
      ];

      invalidNames.forEach(({ value, expected }) => {
        const result = validateBusinessName(value);
        expect(result.isValid).toBe(false);
        expect(result.errorMessage).toBe(expected);
      });
    });
  });

  describe('validateBusinessType', () => {
    it('should validate correct business types', () => {
      const validTypes = [
        'Individual',
        'Partnership',
        'Company',
        'Proprietorship',
        'LLP',
        'HUF',
        'Society',
        'Trust',
        'Other',
      ];

      validTypes.forEach(type => {
        const result = validateBusinessType(type);
        expect(result.isValid).toBe(true);
        expect(result.errorMessage).toBeUndefined();
      });
    });

    it('should reject invalid business types', () => {
      const result = validateBusinessType('');
      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe('Business type is required');
    });
  });

  describe('validateAddress', () => {
    it('should validate correct addresses', () => {
      const validAddresses = [
        '123 Main Street',
        'Building A, Floor 2',
        'Near Railway Station',
        'A'.repeat(5), // Minimum length
      ];

      validAddresses.forEach(address => {
        const result = validateAddress(address);
        expect(result.isValid).toBe(true);
        expect(result.errorMessage).toBeUndefined();
      });
    });

    it('should reject invalid addresses', () => {
      const invalidAddresses = [
        { value: '', expected: 'Address is required' },
        { value: '123', expected: 'Address must be at least 5 characters long' },
        { value: 'A'.repeat(201), expected: 'Address must be less than 200 characters' },
      ];

      invalidAddresses.forEach(({ value, expected }) => {
        const result = validateAddress(value);
        expect(result.isValid).toBe(false);
        expect(result.errorMessage).toBe(expected);
      });
    });

    it('should accept custom field names', () => {
      const result = validateAddress('123 Street', 'Home Address');
      expect(result.isValid).toBe(true);
    });
  });

  describe('validateCity', () => {
    it('should validate correct city names', () => {
      const validCities = [
        'Mumbai',
        'New Delhi',
        'Bangalore',
        'Chennai',
        'A'.repeat(2), // Minimum length
      ];

      validCities.forEach(city => {
        const result = validateCity(city);
        expect(result.isValid).toBe(true);
        expect(result.errorMessage).toBeUndefined();
      });
    });

    it('should reject invalid city names', () => {
      const invalidCities = [
        { value: '', expected: 'City is required' },
        { value: 'A', expected: 'City name must be at least 2 characters long' },
        { value: 'A'.repeat(51), expected: 'City name must be less than 50 characters' },
        { value: 'City123', expected: 'City name contains invalid characters' },
        { value: 'City@#$', expected: 'City name contains invalid characters' },
      ];

      invalidCities.forEach(({ value, expected }) => {
        const result = validateCity(value);
        expect(result.isValid).toBe(false);
        expect(result.errorMessage).toBe(expected);
      });
    });
  });

  describe('validateState', () => {
    it('should validate correct state names', () => {
      const validStates = [
        'Maharashtra',
        'Delhi',
        'Karnataka',
        'Tamil Nadu',
        'A'.repeat(2), // Minimum length
      ];

      validStates.forEach(state => {
        const result = validateState(state);
        expect(result.isValid).toBe(true);
        expect(result.errorMessage).toBeUndefined();
      });
    });

    it('should reject invalid state names', () => {
      const invalidStates = [
        { value: '', expected: 'State is required' },
        { value: 'A', expected: 'State name must be at least 2 characters long' },
        { value: 'A'.repeat(51), expected: 'State name must be less than 50 characters' },
        { value: 'State123', expected: 'State name contains invalid characters' },
        { value: 'State@#$', expected: 'State name contains invalid characters' },
      ];

      invalidStates.forEach(({ value, expected }) => {
        const result = validateState(value);
        expect(result.isValid).toBe(false);
        expect(result.errorMessage).toBe(expected);
      });
    });
  });

  describe('validateOTP', () => {
    it('should validate correct OTPs', () => {
      const validOTPs = [
        '123456',
        '654321',
        '987654',
        '456789',
      ];

      validOTPs.forEach(otp => {
        const result = validateOTP(otp);
        expect(result.isValid).toBe(true);
        expect(result.errorMessage).toBeUndefined();
      });
    });

    it('should reject invalid OTPs', () => {
      const invalidOTPs = [
        { value: '', expected: 'OTP is required' },
        { value: '12345', expected: 'OTP must be exactly 6 digits' },
        { value: '1234567', expected: 'OTP must be exactly 6 digits' },
        { value: '12345a', expected: 'OTP must be exactly 6 digits' },
      ];

      invalidOTPs.forEach(({ value, expected }) => {
        const result = validateOTP(value);
        expect(result.isValid).toBe(false);
        expect(result.errorMessage).toBe(expected);
      });
    });

    it('should handle OTPs with spaces', () => {
      const result = validateOTP('123 456');
      expect(result.isValid).toBe(true);
    });
  });
});
