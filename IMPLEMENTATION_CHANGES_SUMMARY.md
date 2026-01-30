# Onboarding Login Implementation - Summary of Changes

## Problem Statement
- Onboarding links were being generated correctly with valid URLs
- When employees opened the URL in browser, they got a "404 Not Found" error
- Employees needed a login page before accessing the onboarding form
- After login, they should see the onboarding form to complete sections

---

## Solution Overview

Added a **2-step authentication flow** for onboarding:

1. **Step 1: Validate Token** (No auth required)
   - Frontend opens URL with onboarding token
   - Calls `GET /api/onboarding-link/check/:token` to validate token
   - Shows login form if valid

2. **Step 2: Login/Register** (Create employee account)
   - Calls `POST /api/onboarding-link/login` with email + password
   - Creates new employee account on first login
   - Returns JWT token for authenticated requests

3. **Step 3: Access Onboarding Form** (Authenticated)
   - Uses JWT token + onboarding token together
   - Existing endpoints now check both tokens
   - Saves form sections securely

---

## Files Modified

### 1. Backend Controller
**File:** `controllers/onboardingLinkController.js`

**Added Imports:**
```javascript
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const EmployeeUser = require("../models/onboarding/EmployeeUser");
```

**Added Functions:**

#### `employeeLoginOrRegister()`
- **Purpose:** Employee login or auto-register
- **Endpoint:** `POST /api/onboarding-link/login`
- **Parameters:** token, email, password
- **Returns:** JWT token + employee info
- **Logic:**
  - Validate onboarding link exists and not expired
  - Verify email matches the link
  - Check if employee exists:
    - If exists: Verify password
    - If new: Hash password and create account
  - Return JWT token for subsequent requests

#### `validateOnboardingToken()`
- **Purpose:** Check if onboarding token is valid (no login required)
- **Endpoint:** `GET /api/onboarding-link/check/:token`
- **Returns:** Token validity + employee name + email
- **Logic:**
  - Check if token exists
  - Check if expired
  - Return employee info without requiring authentication

---

### 2. Backend Routes
**File:** `routes/onboardingLinkRoutes.js`

**Added Routes:**

```javascript
// Check onboarding token (no auth required)
GET /api/onboarding-link/check/:token

// Employee login/register (no auth required)
POST /api/onboarding-link/login
```

**Route Order:**
- Public routes first (validation, login)
- Protected routes second (form submission)

---

## Backend API Changes

### New Endpoint 1: Validate Token
```
GET /api/onboarding-link/check/:token
```

**No authentication required**

**Response (Valid):**
```json
{
  "success": true,
  "isValid": true,
  "isExpired": false,
  "email": "fiproullaffuda-5874@yopmail.com",
  "firstName": "Siri",
  "lastName": "Vennela",
  "message": "Please login to continue with onboarding"
}
```

---

### New Endpoint 2: Employee Login/Register
```
POST /api/onboarding-link/login
```

**No authentication required**

**Request:**
```json
{
  "token": "acfb016d0facab84e6336d6e8c864d4ebb2f72f2047f3e59fac6dc4eaf352a6b",
  "email": "fiproullaffuda-5874@yopmail.com",
  "password": "MyPassword@123"
}
```

**Response (Success - First Time):**
```json
{
  "success": true,
  "message": "Registration and login successful",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "employee": {
    "id": "user_id",
    "firstName": "Siri",
    "lastName": "Vennela",
    "email": "fiproullaffuda-5874@yopmail.com",
    "role": "employee"
  },
  "onboardingToken": "acfb016d0facab84e6336d6e8c864d4ebb2f72f2047f3e59fac6dc4eaf352a6b"
}
```

**Response (Success - Returning):**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "employee": { /* ... */ },
  "onboardingToken": "acfb016d0facab84e6336d6e8c864d4ebb2f72f2047f3e59fac6dc4eaf352a6b"
}
```

---

## Existing Endpoints (No Changes, But Now Secured)

These endpoints already existed but now work with JWT authentication:

```
GET    /api/onboarding-link/validate/:token          (requires JWT)
GET    /api/onboarding-link/progress/:token          (requires JWT)
POST   /api/onboarding-link/save/:token/:section     (requires JWT)
POST   /api/onboarding-link/submit-declaration/:token (requires JWT)
```

**All require Authorization header:**
```
Authorization: Bearer {jwt_token_from_login}
```

---

## Frontend Implementation Required

### 1. URL Structure
```
https://offer-documentation-frontend.onrender.com/onboarding/{token}
```

### 2. Page Flow

#### Page 1: Login Page
- URL: `/onboarding/{token}`
- Call: `GET /api/onboarding-link/check/{token}`
- Show: Login form with email pre-filled
- Submit: `POST /api/onboarding-link/login`
- On Success: Store JWT token, redirect to form

#### Page 2: Onboarding Form
- URL: `/onboarding-form` (or same page after login)
- Call: `GET /api/onboarding-link/validate/{token}` (with JWT)
- Show: Form with sections (personal, pf, academic, experience, family, declaration)
- On Save: `POST /api/onboarding-link/save/{token}/{section}` (with JWT)
- On Submit: `POST /api/onboarding-link/submit-declaration/{token}` (with JWT)
- On Success: Show success message, optionally redirect

### 3. Token Management
```javascript
// After login
localStorage.setItem('jwtToken', response.token);
localStorage.setItem('onboardingToken', response.onboardingToken);

// For all form requests
headers: {
  'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`
}
```

### 4. Error Handling
- Invalid/expired token → Show error, no login form
- Invalid password → Show error message
- Email mismatch → Show error message
- JWT expired → Redirect to login page
- Failed to save → Show validation errors

---

## Security Improvements

✅ **Password Hashing:** Passwords are hashed using bcrypt (10 rounds)

✅ **JWT Tokens:** 
- Used for all form submission requests
- 7-day expiration
- Secret key from environment variable

✅ **Email Verification:** Email must match the onboarding link

✅ **Link Expiration:** Links expire after final declaration submission

✅ **Two-Factor Security:**
- Onboarding token (in URL)
- JWT token (from login)
- Both required for form submission

---

## Database Impact

### No New Collections
- Uses existing `OnboardingLink` model
- Uses existing `EmployeeUser` model
- Uses existing `OnboardingProgress` model

### EmployeeUser Records
- **First Login:** New employee user created automatically
- **Subsequent Logins:** Existing user verified
- **Password:** Hashed with bcrypt

---

## Environment Variables Required

Make sure these are set in `.env`:

```env
JWT_SECRET=your_jwt_secret_key_here
PUBLIC_WEB_URL=https://offer-documentation-frontend.onrender.com
```

---

## Testing Checklist

- [ ] Generate onboarding link (admin)
- [ ] Copy URL and open in browser
- [ ] See login page (not 404)
- [ ] Login with new password (first time)
- [ ] See onboarding form
- [ ] Fill sections and save
- [ ] Submit declaration
- [ ] See success message
- [ ] Link expires after submission
- [ ] Try same email again - shows login
- [ ] Login with same password - works
- [ ] Form shows previously saved data

---

## Backward Compatibility

✅ All existing admin endpoints unchanged
✅ All existing validation endpoints unchanged  
✅ New endpoints don't break existing flows
✅ Optional frontend feature (login page)

---

## Next Steps for Frontend Team

1. Create login page component
2. Add route: `/onboarding/:token`
3. Call validation endpoint on mount
4. Show login form or error
5. Handle login submission
6. Store JWT token
7. Redirect to form with all tokens
8. Use JWT token in all form requests
9. Clear tokens on logout/completion

---

## Support & Debugging

### If you see "Invalid onboarding link"
- ❌ Token might be malformed in URL
- ✅ Check: Token is copied correctly from email link

### If you see "Email does not match"
- ❌ User entered different email than the link
- ✅ Email should be pre-filled and readonly

### If form doesn't save
- ❌ JWT token might be expired
- ❌ Authorization header might be missing/malformed
- ✅ Format: `Authorization: Bearer {token}` with space

### If password is wrong on second login
- ✅ This is correct behavior - same password required
- Use password reset if needed (not yet implemented)

---

**Implementation Date:** January 30, 2026  
**Backend Status:** ✅ Complete  
**Frontend Status:** ⏳ Pending  
