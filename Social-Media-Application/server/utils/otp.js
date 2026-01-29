// Generate a random 6-digit OTP
export const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// Get OTP expiry time (valid for 10 minutes)
export const getOTPExpiryTime = (minutes = 10) => {
    return new Date(Date.now() + minutes * 60 * 1000);
};

// Check if OTP is valid and not expired
export const isOTPValid = (storedOTP, otpExpiresAt, providedOTP) => {
    // Check if OTP matches
    if (storedOTP !== providedOTP) {
        return { valid: false, message: "Invalid OTP" };
    }

    // Check if OTP is expired
    if (new Date() > new Date(otpExpiresAt)) {
        return { valid: false, message: "OTP has expired. Request a new one." };
    }

    return { valid: true, message: "OTP verified successfully" };
};

export default { generateOTP, getOTPExpiryTime, isOTPValid };
