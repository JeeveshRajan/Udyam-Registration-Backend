"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateAadhaar = validateAadhaar;
exports.validatePAN = validatePAN;
exports.validateMobile = validateMobile;
exports.validateEmail = validateEmail;
exports.validatePincode = validatePincode;
exports.validateBusinessName = validateBusinessName;
exports.validateBusinessType = validateBusinessType;
exports.validateAddress = validateAddress;
exports.validateCity = validateCity;
exports.validateState = validateState;
exports.validateOTP = validateOTP;
function validateAadhaar(aadhaar) {
    if (!aadhaar) {
        return {
            isValid: false,
            errorMessage: 'Aadhaar number is required'
        };
    }
    const cleanAadhaar = aadhaar.replace(/[\s-]/g, '');
    if (!/^\d{12}$/.test(cleanAadhaar)) {
        return {
            isValid: false,
            errorMessage: 'Aadhaar number must be exactly 12 digits'
        };
    }
    if (/^(\d)\1{11}$/.test(cleanAadhaar)) {
        return {
            isValid: false,
            errorMessage: 'Invalid Aadhaar number'
        };
    }
    if (!isValidAadhaarChecksum(cleanAadhaar)) {
        return {
            isValid: false,
            errorMessage: 'Invalid Aadhaar number checksum'
        };
    }
    return { isValid: true };
}
function validatePAN(pan) {
    if (!pan) {
        return {
            isValid: false,
            errorMessage: 'PAN number is required'
        };
    }
    const cleanPAN = pan.replace(/\s/g, '').toUpperCase();
    if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(cleanPAN)) {
        return {
            isValid: false,
            errorMessage: 'PAN must be in format: ABCDE1234F (5 letters + 4 digits + 1 letter)'
        };
    }
    if (/^([A-Z0-9])\1{9}$/.test(cleanPAN)) {
        return {
            isValid: false,
            errorMessage: 'Invalid PAN number'
        };
    }
    return { isValid: true };
}
function validateMobile(mobile) {
    if (!mobile) {
        return {
            isValid: false,
            errorMessage: 'Mobile number is required'
        };
    }
    const cleanMobile = mobile.replace(/[\s\-+]/g, '');
    if (!/^[6-9]\d{9}$/.test(cleanMobile)) {
        return {
            isValid: false,
            errorMessage: 'Mobile number must be 10 digits starting with 6, 7, 8, or 9'
        };
    }
    return { isValid: true };
}
function validateEmail(email) {
    if (!email) {
        return {
            isValid: false,
            errorMessage: 'Email address is required'
        };
    }
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
        return {
            isValid: false,
            errorMessage: 'Please enter a valid email address'
        };
    }
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
function validatePincode(pincode) {
    if (!pincode) {
        return {
            isValid: false,
            errorMessage: 'PIN code is required'
        };
    }
    const cleanPincode = pincode.replace(/\s/g, '');
    if (!/^\d{6}$/.test(cleanPincode)) {
        return {
            isValid: false,
            errorMessage: 'PIN code must be exactly 6 digits'
        };
    }
    if (/^(\d)\1{5}$/.test(cleanPincode)) {
        return {
            isValid: false,
            errorMessage: 'Invalid PIN code'
        };
    }
    return { isValid: true };
}
function validateBusinessName(businessName) {
    if (!businessName) {
        return {
            isValid: false,
            errorMessage: 'Business name is required'
        };
    }
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
    if (!/^[a-zA-Z0-9\s.,\-&()]+$/.test(cleanName)) {
        return {
            isValid: false,
            errorMessage: 'Business name contains invalid characters'
        };
    }
    return { isValid: true };
}
function validateBusinessType(businessType) {
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
function validateAddress(address, fieldName = 'Address') {
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
function validateCity(city) {
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
    if (!/^[a-zA-Z\s.]+$/.test(cleanCity)) {
        return {
            isValid: false,
            errorMessage: 'City name contains invalid characters'
        };
    }
    return { isValid: true };
}
function validateState(state) {
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
    if (!/^[a-zA-Z\s.]+$/.test(cleanState)) {
        return {
            isValid: false,
            errorMessage: 'State name contains invalid characters'
        };
    }
    return { isValid: true };
}
function isValidAadhaarChecksum(aadhaar) {
    if (aadhaar.startsWith('0') || aadhaar.startsWith('1')) {
        return false;
    }
    const digits = aadhaar.split('').map(Number);
    let sequentialCount = 0;
    for (let i = 1; i < digits.length; i++) {
        if (digits[i] === digits[i - 1] + 1) {
            sequentialCount++;
        }
        else {
            sequentialCount = 0;
        }
        if (sequentialCount >= 3)
            return false;
    }
    return true;
}
function validateOTP(otp) {
    if (!otp) {
        return {
            isValid: false,
            errorMessage: 'OTP is required'
        };
    }
    const cleanOTP = otp.replace(/\s/g, '');
    if (!/^\d{6}$/.test(cleanOTP)) {
        return {
            isValid: false,
            errorMessage: 'OTP must be exactly 6 digits'
        };
    }
    return { isValid: true };
}
//# sourceMappingURL=validators.js.map