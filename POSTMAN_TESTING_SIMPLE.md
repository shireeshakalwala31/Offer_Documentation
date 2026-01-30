# 🧪 SIMPLE POSTMAN TESTING GUIDE

## Quick Test Flow (Copy-Paste Ready)

### Test 1: Generate Onboarding Link
**Method:** POST  
**URL:** `http://localhost:5000/api/onboarding-link/generate`

**Headers:**
```
Authorization: Bearer {ADMIN_JWT_TOKEN}
Content-Type: application/json
```

**Body:**
```json
{
  "email": "candidate@example.com",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Onboarding link generated successfully",
  "token": "abc123xyz...",
  "url": "https://offer-documentation-frontend.onrender.com/onboarding/abc123xyz...",
  "email": "candidate@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "password": "A7F2Q9X1",
  "draftId": "DRAFT-1234567890-abcd"
}
```

**✅ IMPORTANT:** Copy these values:
- `token` → Use as `{ONBOARDING_TOKEN}`
- `password` → Use as `{PASSWORD}` in next test
- `email` → Use as `{EMAIL}` in next test

---

### Test 2: Check Link Validity (No Auth)
**Method:** GET  
**URL:** `http://localhost:5000/api/onboarding-link/check/{ONBOARDING_TOKEN}`

**Headers:**
```
Content-Type: application/json
```

**Body:** None

**Expected Response:**
```json
{
  "success": true,
  "isValid": true,
  "isExpired": false,
  "email": "candidate@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "message": "Please login to continue with onboarding"
}
```

---

### Test 3: Candidate Login
**Method:** POST  
**URL:** `http://localhost:5000/api/onboarding-link/login`

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "token": "{ONBOARDING_TOKEN}",
  "email": "{EMAIL}",
  "password": "{PASSWORD}"
}
```

**Example:**
```json
{
  "token": "abc123xyz...",
  "email": "candidate@example.com",
  "password": "A7F2Q9X1"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "candidate": {
    "email": "candidate@example.com",
    "firstName": "John",
    "lastName": "Doe"
  },
  "onboardingToken": "abc123xyz..."
}
```

**✅ IMPORTANT:** Copy the returned `token` → Use as `{JWT_TOKEN}` in next tests

---

### Test 4: Validate Link & Get Progress (After Login)
**Method:** GET  
**URL:** `http://localhost:5000/api/onboarding-link/validate/{ONBOARDING_TOKEN}`

**Headers:**
```
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json
```

**Body:** None

**Expected Response:**
```json
{
  "success": true,
  "isExpired": false,
  "draftId": "DRAFT-1234567890-abcd",
  "email": "candidate@example.com",
  "progress": {
    "token": "abc123xyz...",
    "email": "candidate@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "currentSection": "personal",
    "personal": false,
    "pf": false,
    "academic": false,
    "experience": false,
    "family": false,
    "declaration": false,
    "isFullyCompleted": false,
    "completionPercentage": 0
  },
  "existingData": {
    "personal": null,
    "pf": null,
    "academic": null,
    "experience": null,
    "family": null,
    "declaration": null
  }
}
```

---

### Test 5: Save Personal Section
**Method:** POST  
**URL:** `http://localhost:5000/api/onboarding-link/save/{ONBOARDING_TOKEN}/personal`

**Headers:**
```
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json
```

**Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "dateOfBirth": "1990-05-15",
  "gender": "Male",
  "mobileNumber": "9876543210"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Section saved successfully",
  "section": "personal",
  "data": {
    "draftId": "DRAFT-1234567890-abcd",
    "firstName": "John",
    "lastName": "Doe",
    "dateOfBirth": "1990-05-15",
    "gender": "Male",
    "mobileNumber": "9876543210"
  }
}
```

---

### Test 6: Check Progress Update
**Method:** GET  
**URL:** `http://localhost:5000/api/onboarding-link/validate/{ONBOARDING_TOKEN}`

**Headers:**
```
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json
```

**Expected Response:**
Note: `completionPercentage` should be higher now (not 0%)

```json
{
  "success": true,
  "progress": {
    "completionPercentage": 16,
    "personal": true,
    "pf": false,
    // ...
  }
}
```

---

### Test 7: Save Another Section (PF)
**Method:** POST  
**URL:** `http://localhost:5000/api/onboarding-link/save/{ONBOARDING_TOKEN}/pf`

**Headers:**
```
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json
```

**Body:**
```json
{
  "accountNumber": "1234567890",
  "memberNumber": "PM123456"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Section saved successfully",
  "section": "pf"
}
```

---

### Test 8: Resume - Check Saved Data
**Method:** GET  
**URL:** `http://localhost:5000/api/onboarding-link/validate/{ONBOARDING_TOKEN}`

**Headers:**
```
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json
```

**Expected Response:**
```json
{
  "success": true,
  "progress": {
    "completionPercentage": 33,
    "personal": true,
    "pf": true,
    "academic": false
  },
  "existingData": {
    "personal": {
      "firstName": "John",
      "lastName": "Doe",
      "dateOfBirth": "1990-05-15"
    },
    "pf": {
      "accountNumber": "1234567890"
    }
  }
}
```

---

### Test 9: Complete All Sections (Quick Method)
Repeat Test 7 for all sections:
- `academic`
- `experience`
- `family`
- `declaration`

Each time, add relevant data.

---

### Test 10: Submit Declaration (FINAL STEP)
**Method:** POST  
**URL:** `http://localhost:5000/api/onboarding-link/submit-declaration/{ONBOARDING_TOKEN}`

**Headers:**
```
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json
```

**Body:**
```json
{
  "declarationAccepted": true
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Onboarding completed successfully",
  "token": "abc123xyz..."
}
```

**✅ LINK NOW EXPIRES**

---

### Test 11: Verify Link is Expired
**Method:** GET  
**URL:** `http://localhost:5000/api/onboarding-link/check/{ONBOARDING_TOKEN}`

**Headers:**
```
Content-Type: application/json
```

**Expected Response:**
```json
{
  "success": false,
  "message": "This onboarding link has expired",
  "isValid": false,
  "isExpired": true
}
```

---

## ❌ Error Test Cases

### Test: Wrong Password
**Method:** POST  
**URL:** `http://localhost:5000/api/onboarding-link/login`

**Body:**
```json
{
  "token": "abc123xyz...",
  "email": "candidate@example.com",
  "password": "WRONGPASS"
}
```

**Expected Response:**
```json
{
  "success": false,
  "message": "Invalid password. Please check the password sent to your email."
}
```

---

### Test: Wrong Email
**Method:** POST  
**URL:** `http://localhost:5000/api/onboarding-link/login`

**Body:**
```json
{
  "token": "abc123xyz...",
  "email": "different@example.com",
  "password": "A7F2Q9X1"
}
```

**Expected Response:**
```json
{
  "success": false,
  "message": "Email does not match the onboarding link"
}
```

---

### Test: Invalid Token
**Method:** POST  
**URL:** `http://localhost:5000/api/onboarding-link/login`

**Body:**
```json
{
  "token": "invalid_token_xyz",
  "email": "candidate@example.com",
  "password": "A7F2Q9X1"
}
```

**Expected Response:**
```json
{
  "success": false,
  "message": "Invalid onboarding link"
}
```

---

### Test: Missing JWT Token Header
**Method:** GET  
**URL:** `http://localhost:5000/api/onboarding-link/validate/{ONBOARDING_TOKEN}`

**Headers:**
```
Content-Type: application/json
(NO Authorization header)
```

**Expected Response:**
```json
{
  "message": "Token missing"
}
```

---

## 📋 Postman Collection Setup (Optional)

Create a Postman environment with these variables:

```
BASE_URL = http://localhost:5000
ADMIN_TOKEN = (your admin JWT token)
ONBOARDING_TOKEN = (generated from Test 1)
JWT_TOKEN = (generated from Test 3)
EMAIL = candidate@example.com
PASSWORD = (copied from Test 1 response)
```

Then use in requests:
```
{{BASE_URL}}/api/onboarding-link/generate
{{BASE_URL}}/api/onboarding-link/login
```

---

## 🎯 Quick Test Sequence

1. ✅ Test 1: Generate Link (get token + password)
2. ✅ Test 2: Check validity
3. ✅ Test 3: Login (get JWT token)
4. ✅ Test 4: Load form
5. ✅ Test 5: Save Personal
6. ✅ Test 6: Check progress (should show 16%)
7. ✅ Test 7: Save PF
8. ✅ Test 8: Resume check (should show saved data)
9. ✅ Test 10: Submit Declaration
10. ✅ Test 11: Verify expired

**If all pass → Backend is perfect! ✅**

---

## 🚨 Common Issues

### "Token missing" on validate endpoint
❌ Missing `Authorization: Bearer {JWT_TOKEN}` header

### "Invalid password"
❌ Copied password wrong or modified it

### "Email does not match"
❌ Email doesn't match exactly (check spaces, case)

### "Link has expired"
✅ This is correct if you already submitted declaration

### Response shows old data
❌ Clear browser cache or use Postman's "Send and Download" option

---

**That's it! You now have a complete testing guide.** 🎉
