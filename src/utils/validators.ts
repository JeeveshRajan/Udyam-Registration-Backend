/**
 * Validation utilities for Udyam registration form
 * Implements validation rules extracted from the original form
 */

export interface ValidationResult {
  isValid: boolean;
  errorMessage?: string;
}

/**
 * Validates Aadhaar number (12 digits)
 * @param aadhaar - Aadhaar number to validate
 * @returns ValidationResult with validation status and error message
 */
export function validateAadhaar(aadhaar: string): ValidationResult {
  if (!aadhaar) {
    return {
      isValid: false,
      errorMessage: 'Aadhaar number is required'
    };
  }

  // Remove spaces and hyphens
  const cleanAadhaar = aadhaar.replace(/[\s-]/g, '');

  // Check if it's exactly 12 digits
  if (!/^\d{12}$/.test(cleanAadhaar)) {
    return {
      isValid: false,
      errorMessage: 'Aadhaar number must be exactly 12 digits'
    };
  }

  // Check if all digits are not the same (e.g., 111111111111)
  if (/^(\d)\1{11}$/.test(cleanAadhaar)) {
    return {
      isValid: false,
      errorMessage: 'Invalid Aadhaar number'
    };
  }

  // Basic checksum validation (Verhoeff algorithm simplified)
  if (!isValidAadhaarChecksum(cleanAadhaar)) {
    return {
      isValid: false,
      errorMessage: 'Invalid Aadhaar number checksum'
    };
  }

  return { isValid: true };
}

/**
 * Validates PAN number (10 characters: 5 letters + 4 digits + 1 letter)
 * @param pan - PAN number to validate
 * @returns ValidationResult with validation status and error message
 */
export function validatePAN(pan: string): ValidationResult {
  if (!pan) {
    return {
      isValid: false,
      errorMessage: 'PAN number is required'
    };
  }

  // Remove spaces
  const cleanPAN = pan.replace(/\s/g, '').toUpperCase();

  // Check PAN format: [A-Z]{5}[0-9]{4}[A-Z]{1}
  if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(cleanPAN)) {
    return {
      isValid: false,
      errorMessage: 'PAN must be in format: ABCDE1234F (5 letters + 4 digits + 1 letter)'
    };
  }

  // Check if all characters are not the same
  if (/^([A-Z0-9])\1{9}$/.test(cleanPAN)) {
    return {
      isValid: false,
      errorMessage: 'Invalid PAN number'
    };
  }

  return { isValid: true };
}

/**
 * Validates mobile number (10 digits, starts with 6-9)
 * @param mobile - Mobile number to validate
 * @returns ValidationResult with validation status and error message
 */
export function validateMobile(mobile: string): ValidationResult {
  if (!mobile) {
    return {
      isValid: false,
      errorMessage: 'Mobile number is required'
    };
  }

  // Remove spaces, hyphens, and plus sign
  const cleanMobile = mobile.replace(/[\s\-+]/g, '');

  // Check if it's exactly 10 digits and starts with 6-9
  if (!/^[6-9]\d{9}$/.test(cleanMobile)) {
    return {
      isValid: false,
      errorMessage: 'Mobile number must be 10 digits starting with 6, 7, 8, or 9'
    };
  }

  return { isValid: true };
}

/**
 * Validates email address format
 * @param email - Email address to validate
 * @returns ValidationResult with validation status and error message
 */
export function validateEmail(email: string): ValidationResult {
  if (!email) {
    return {
      isValid: false,
      errorMessage: 'Email address is required'
    };
  }

  // Basic email format validation
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  
  if (!emailRegex.test(email)) {
    return {
      isValid: false,
      errorMessage: 'Please enter a valid email address'
    };
  }

  // Check for common disposable email domains
  const disposableDomains = [
    'tempmail.org', 'guerrillamail.com', '10minutemail.com',
    'mailinator.com', 'yopmail.com', 'throwaway.email'
  ];

  const domain = email.split('@')[1]?.toLowerCase();
  if (domain && disposableDomains.includes(domain)) {
    return {
      isValid: false,
      errorMessage: 'Disposable email addresses are not allowed'
    };
  }

  return { isValid: true };
}

/**
 * Validates PIN code (6 digits)
 * @param pincode - PIN code to validate
 * @returns ValidationResult with validation status and error message
 */
export function validatePincode(pincode: string): ValidationResult {
  if (!pincode) {
    return {
      isValid: false,
      errorMessage: 'PIN code is required'
    };
  }

  // Remove spaces
  const cleanPincode = pincode.replace(/\s/g, '');

  // Check if it's exactly 6 digits
  if (!/^\d{6}$/.test(cleanPincode)) {
    return {
      isValid: false,
      errorMessage: 'PIN code must be exactly 6 digits'
    };
  }

  // Check if all digits are not the same
  if (/^(\d)\1{5}$/.test(cleanPincode)) {
    return {
      isValid: false,
      errorMessage: 'Invalid PIN code'
    };
  }

  return { isValid: true };
}

/**
 * Validates business name
 * @param businessName - Business name to validate
 * @returns ValidationResult with validation status and error message
 */
export function validateBusinessName(businessName: string): ValidationResult {
  if (!businessName) {
    return {
      isValid: false,
      errorMessage: 'Business name is required'
    };
  }

  // Remove extra spaces
  const cleanName = businessName.trim();

  if (cleanName.length < 2) {
    return {
      isValid: false,
      errorMessage: 'Business name must be at least 2 characters long'
    };
  }

  if (cleanName.length > 100) {
    return {
      isValid: false,
      errorMessage: 'Business name must be less than 100 characters'
    };
  }

  // Check for valid characters (letters, numbers, spaces, dots, commas, hyphens)
  if (!/^[a-zA-Z0-9\s.,\-&()]+$/.test(cleanName)) {
    return {
      isValid: false,
      errorMessage: 'Business name contains invalid characters'
    };
  }

  return { isValid: true };
}

/**
 * Validates business type
 * @param businessType - Business type to validate
 * @returns ValidationResult with validation status and error message
 */
export function validateBusinessType(businessType: string): ValidationResult {
  if (!businessType) {
    return {
      isValid: false,
      errorMessage: 'Business type is required'
    };
  }

  const validTypes = [
    'Individual',
    'Partnership',
    'Company',
    'Proprietorship',
    'LLP',
    'HUF',
    'Society',
    'Trust',
    'Other'
  ];

  if (!validTypes.includes(businessType)) {
    return {
      isValid: false,
      errorMessage: 'Please select a valid business type'
    };
  }

  return { isValid: true };
}

/**
 * Validates address fields
 * @param address - Address to validate
 * @param fieldName - Name of the address field
 * @returns ValidationResult with validation status and error message
 */
export function validateAddress(address: string, fieldName: string = 'Address'): ValidationResult {
  if (!address) {
    return {
      isValid: false,
      errorMessage: `${fieldName} is required`
    };
  }

  const cleanAddress = address.trim();

  if (cleanAddress.length < 5) {
    return {
      isValid: false,
      errorMessage: `${fieldName} must be at least 5 characters long`
    };
  }

  if (cleanAddress.length > 200) {
    return {
      isValid: false,
      errorMessage: `${fieldName} must be less than 200 characters`
    };
  }

  return { isValid: true };
}

/**
 * Validates city name
 * @param city - City name to validate
 * @returns ValidationResult with validation status and error message
 */
export function validateCity(city: string): ValidationResult {
  if (!city) {
    return {
      isValid: false,
      errorMessage: 'City is required'
    };
  }

  const cleanCity = city.trim();

  if (cleanCity.length < 2) {
    return {
      isValid: false,
      errorMessage: 'City name must be at least 2 characters long'
    };
  }

  if (cleanCity.length > 50) {
    return {
      isValid: false,
      errorMessage: 'City name must be less than 50 characters'
    };
  }

  // Check for valid characters (letters, spaces, dots)
  if (!/^[a-zA-Z\s.]+$/.test(cleanCity)) {
    return {
      isValid: false,
      errorMessage: 'City name contains invalid characters'
    };
  }

  return { isValid: true };
}

/**
 * Validates state name
 * @param state - State name to validate
 * @returns ValidationResult with validation status and error message
 */
export function validateState(state: string): ValidationResult {
  if (!state) {
    return {
      isValid: false,
      errorMessage: 'State is required'
    };
  }

  const cleanState = state.trim();

  if (cleanState.length < 2) {
    return {
      isValid: false,
      errorMessage: 'State name must be at least 2 characters long'
    };
  }

  if (cleanState.length > 50) {
    return {
      isValid: false,
      errorMessage: 'State name must be less than 50 characters'
    };
  }

  // Check for valid characters (letters, spaces, dots)
  if (!/^[a-zA-Z\s.]+$/.test(cleanState)) {
    return {
      isValid: false,
      errorMessage: 'State name contains invalid characters'
    };
  }

  return { isValid: true };
}

/**
 * Simplified Aadhaar checksum validation
 * @param aadhaar - 12-digit Aadhaar number
 * @returns boolean indicating if checksum is valid
 */
function isValidAadhaarChecksum(aadhaar: string): boolean {
  // This is a simplified validation
  // In production, you might want to implement the full Verhoeff algorithm
  
  // Check if the number doesn't start with 0 or 1
  if (aadhaar.startsWith('0') || aadhaar.startsWith('1')) {
    return false;
  }

  // Basic pattern check - Aadhaar should not have obvious patterns
  const digits = aadhaar.split('').map(Number);
  
  // Check for sequential patterns
  let sequentialCount = 0;
  for (let i = 1; i < digits.length; i++) {
    if (digits[i] === digits[i - 1] + 1) {
      sequentialCount++;
    } else {
      sequentialCount = 0;
    }
    if (sequentialCount >= 3) return false;
  }

  return true;
}

/**
 * Validates OTP (6 digits)
 * @param otp - OTP to validate
 * @returns ValidationResult with validation status and error message
 */
export function validateOTP(otp: string): ValidationResult {
  if (!otp) {
    return {
      isValid: false,
      errorMessage: 'OTP is required'
    };
  }

  // Remove spaces
  const cleanOTP = otp.replace(/\s/g, '');

  // Check if it's exactly 6 digits
  if (!/^\d{6}$/.test(cleanOTP)) {
    return {
      isValid: false,
      errorMessage: 'OTP must be exactly 6 digits'
    };
  }

  return { isValid: true };
}
