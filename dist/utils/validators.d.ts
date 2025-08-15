export interface ValidationResult {
    isValid: boolean;
    errorMessage?: string;
}
export declare function validateAadhaar(aadhaar: string): ValidationResult;
export declare function validatePAN(pan: string): ValidationResult;
export declare function validateMobile(mobile: string): ValidationResult;
export declare function validateEmail(email: string): ValidationResult;
export declare function validatePincode(pincode: string): ValidationResult;
export declare function validateBusinessName(businessName: string): ValidationResult;
export declare function validateBusinessType(businessType: string): ValidationResult;
export declare function validateAddress(address: string, fieldName?: string): ValidationResult;
export declare function validateCity(city: string): ValidationResult;
export declare function validateState(state: string): ValidationResult;
export declare function validateOTP(otp: string): ValidationResult;
//# sourceMappingURL=validators.d.ts.map