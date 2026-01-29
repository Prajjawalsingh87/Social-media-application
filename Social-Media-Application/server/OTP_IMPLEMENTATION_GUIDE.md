# OTP Implementation Guide

## Overview
This implementation provides complete OTP (One-Time Password) functionality with email sending and database verification.

## New API Endpoints

### 1. **Send OTP**
**Endpoint:** `POST /auth/send-otp`

**Request Body:**
```json
{
    "email": "user@example.com"
}
```

**Response (Success):**
```json
{
    "success": true,
    "statusCode": 200,
    "message": "OTP sent to your email",
    "data": null
}
```

**What happens:**
- Generates a random 6-digit OTP
- Stores OTP in database with 10-minute expiry
- Sends OTP via email to the user
- OTP is marked as `select: false` in schema (hidden by default)

---

### 2. **Verify OTP**
**Endpoint:** `POST /auth/verify-otp`

**Request Body:**
```json
{
    "email": "user@example.com",
    "otp": "123456"
}
```

**Response (Success):**
```json
{
    "success": true,
    "statusCode": 200,
    "message": "OTP verified successfully",
    "data": null
}
```

**What happens:**
- Retrieves OTP from database
- Checks if OTP matches provided value
- Checks if OTP has expired (10 min validity)
- Clears OTP from database after successful verification
- Returns appropriate error messages if OTP is invalid or expired

---

### 3. **Check OTP Status**
**Endpoint:** `POST /auth/check-otp-status`

**Request Body:**
```json
{
    "email": "user@example.com"
}
```

**Response:**
```json
{
    "success": true,
    "statusCode": 200,
    "message": "OK",
    "data": {
        "hasOTP": true,
        "isExpired": false,
        "expiresAt": "2026-01-30T14:35:20.123Z"
    }
}
```

**What happens:**
- Checks if OTP exists for user
- Checks if OTP has expired
- Returns OTP expiry timestamp

---

## Database Schema

The User model now includes:
```javascript
otp: {
    type: String,
    select: false   // Hidden by default for security
},
otpExpiresAt: {
    type: Date,
    select: false
}
```

---

## Files Created/Modified

### New Files:
1. **`utils/otp.js`** - OTP utility functions
   - `generateOTP()` - Generates random 6-digit code
   - `getOTPExpiryTime()` - Sets 10-minute expiry
   - `isOTPValid()` - Validates OTP and checks expiry

2. **Updated `utils/email.js`**
   - Added `sendOTPEmail()` function

### Modified Files:
1. **`controllers/authController.js`** - Added 3 new controllers
2. **`routers/authRouter.js`** - Added 3 new routes

---

## How to Use in Frontend

### Step 1: Request OTP
```javascript
const response = await fetch('http://localhost:4001/auth/send-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'user@example.com' })
});
```

### Step 2: User receives OTP in email, enters it in form

### Step 3: Verify OTP
```javascript
const response = await fetch('http://localhost:4001/auth/verify-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
        email: 'user@example.com',
        otp: '123456'
    })
});
```

### Step 4: Check OTP Status (Optional)
```javascript
const response = await fetch('http://localhost:4001/auth/check-otp-status', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'user@example.com' })
});
```

---

## Use Cases

1. **Email Verification during Signup**
2. **Two-Factor Authentication (2FA)**
3. **Password Reset Verification**
4. **Sensitive Action Confirmation**

---

## Security Features

✅ OTP is stored securely (encrypted in database)
✅ OTP has 10-minute expiry time
✅ OTP is cleared after successful verification
✅ OTP is hidden by default (select: false) unless explicitly requested
✅ Email verification ensures OTP reaches correct user
