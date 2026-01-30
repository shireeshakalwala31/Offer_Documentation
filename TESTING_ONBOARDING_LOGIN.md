# Quick Testing Checklist for Onboarding Login Flow

## Prerequisites
- Backend running with `PUBLIC_WEB_URL` environment variable set
- Frontend URL accessible (e.g., https://offer-documentation-frontend.onrender.com)
- Admin token for generating links

---

## Test Scenario 1: New Employee Registration + Onboarding

### Step 1: Generate Onboarding Link (Postman - Admin)
```
POST http://localhost:5000/api/onboarding-link/generate
Authorization: Bearer {ADMIN_TOKEN}
Content-Type: application/json

{
  "email": "test@example.com",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Onboarding link generated successfully",
  "token": "abc123...",
  "url": "https://offer-documentation-frontend.onrender.com/onboarding/abc123...",
  "email": "test@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "draftId": "DRAFT-..."
}
```

**Copy the URL and open in browser →**

### Step 2: Browser - Check Token Validation
The page should make a request to:
```
GET /api/onboarding-link/check/{token}
```

**Expected:** Login form appears with email pre-filled

### Step 3: Browser - Employee Login (First Time)
Fill in:
- Email: test@example.com
- Password: MyPassword@123

Frontend should POST to:
```
POST /api/onboarding-link/login
Content-Type: application/json

{
  "token": "abc123...",
  "email": "test@example.com",
  "password": "MyPassword@123"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Registration and login successful",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "employee": {
    "id": "user_id",
    "firstName": "John",
    "lastName": "Doe",
    "email": "test@example.com",
    "role": "employee"
  },
  "onboardingToken": "abc123..."
}
```

**Result:** Employee account created, JWT token returned, redirect to onboarding form

### Step 4: Browser - Load Onboarding Form
Frontend should validate the link:
```
GET /api/onboarding-link/validate/{onboardingToken}
Authorization: Bearer {jwtToken}
```

**Expected:** Form loads with all empty sections, shows 0% completion

### Step 5: Browser - Fill & Save Sections
For each section (personal, pf, academic, etc.):
```
POST /api/onboarding-link/save/{token}/{section}
Authorization: Bearer {jwtToken}
Content-Type: application/json

{
  // section-specific data
}
```

**Expected:** Each section saves successfully

### Step 6: Browser - Submit Declaration
```
POST /api/onboarding-link/submit-declaration/{onboardingToken}
Authorization: Bearer {jwtToken}
Content-Type: application/json

{
  "declarationAccepted": true
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Onboarding completed successfully",
  "token": "abc123..."
}
```

**Result:** Onboarding link is now expired

---

## Test Scenario 2: Returning Employee (Login)

### Step 1: Generate New Link for Same Email
```
POST http://localhost:5000/api/onboarding-link/generate
Authorization: Bearer {ADMIN_TOKEN}

{
  "email": "test@example.com",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Expected:** Should get existing link (as link is still active)

### Step 2: Open Link in Browser
Same process as before

### Step 3: Employee Login (Returning)
Same email and password as before:
```
POST /api/onboarding-link/login

{
  "token": "abc123...",
  "email": "test@example.com",
  "password": "MyPassword@123"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  // ... employee data
}
```

**Result:** Different JWT token, but same employee account

### Step 4: Load Form - Should Show Saved Data
```
GET /api/onboarding-link/validate/{token}
Authorization: Bearer {jwtToken}
```

**Expected:** `existingData` should contain previously saved data, progress percentage > 0

---

## Test Scenario 3: Invalid Cases

### Test: Invalid Token
```
GET /api/onboarding-link/check/invalid_token_xyz
```

**Expected:**
```json
{
  "success": false,
  "message": "Invalid onboarding link",
  "isValid": false
}
```

### Test: Email Mismatch During Login
```
POST /api/onboarding-link/login

{
  "token": "abc123...",
  "email": "different@example.com",
  "password": "MyPassword@123"
}
```

**Expected:**
```json
{
  "success": false,
  "message": "Email does not match the onboarding link"
}
```

### Test: Wrong Password
```
POST /api/onboarding-link/login

{
  "token": "abc123...",
  "email": "test@example.com",
  "password": "WrongPassword@123"
}
```

**Expected:**
```json
{
  "success": false,
  "message": "Invalid password"
}
```

### Test: Expired Link
After submitting declaration, try to access:
```
GET /api/onboarding-link/check/expired_token
```

**Expected:**
```json
{
  "success": false,
  "message": "This onboarding link has expired",
  "isValid": false,
  "isExpired": true
}
```

---

## Postman Collection Template

Create a Postman collection with these requests:

1. **Auth - Admin Login**
   - POST: `/api/auth/login` (or your admin login endpoint)
   - Save token as `{{admin_token}}`

2. **Step 1 - Generate Link**
   - POST: `/api/onboarding-link/generate`
   - Auth: Bearer {{admin_token}}
   - Save token as `{{onboarding_token}}`

3. **Step 2 - Check Token**
   - GET: `/api/onboarding-link/check/{{onboarding_token}}`
   - No auth needed

4. **Step 3 - Employee Login**
   - POST: `/api/onboarding-link/login`
   - Save token as `{{jwt_token}}`

5. **Step 4 - Validate Link**
   - GET: `/api/onboarding-link/validate/{{onboarding_token}}`
   - Auth: Bearer {{jwt_token}}

6. **Step 5 - Save Personal Section**
   - POST: `/api/onboarding-link/save/{{onboarding_token}}/personal`
   - Auth: Bearer {{jwt_token}}

7. **Step 6 - Save Other Sections** (repeat for pf, academic, etc.)

8. **Step 7 - Submit Declaration**
   - POST: `/api/onboarding-link/submit-declaration/{{onboarding_token}}`
   - Auth: Bearer {{jwt_token}}

---

## Expected Flow in Browser

1. User gets email with onboarding URL
2. Opens URL in browser
3. ✅ Login page appears (not 404!)
4. User enters password
5. ✅ Redirects to onboarding form
6. User fills all sections
7. User submits declaration
8. ✅ Success page appears

---

## Debugging Tips

### If you get 404 on the URL:
- ❌ Frontend is not handling the token parameter correctly
- ❌ Frontend route `/onboarding/:token` is not set up
- ✅ Make sure frontend calls `GET /api/onboarding-link/check/:token` first

### If login fails:
- ❌ Token is invalid - check if link was generated successfully
- ❌ Email doesn't match - ensure email matches exactly
- ❌ Password is wrong - create new test with simple password

### If JWT token is invalid:
- ❌ Check if `JWT_SECRET` in .env is same in backend
- ❌ Check if token is being sent in Authorization header correctly
- ✅ Format: `Authorization: Bearer {token}` (with space after Bearer)

### If sections don't save:
- ❌ Check JWT token is valid
- ❌ Check onboarding token is correct
- ❌ Check section name is one of: personal, pf, academic, experience, family, declaration

---

## Success Indicators

✅ Login page appears when opening onboarding URL  
✅ New employee can register with password  
✅ Returning employee can login with same password  
✅ Onboarding form loads after login  
✅ Sections save with JWT authentication  
✅ Final declaration completes the flow  
✅ Link expires after completion  

Once all these pass, the implementation is complete!
