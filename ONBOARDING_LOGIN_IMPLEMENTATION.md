# Onboarding Flow Implementation Guide

## Overview
The onboarding flow now includes a login step before accessing the onboarding form. Here's how the complete flow works:

### New Flow:
1. **Generate Onboarding Link** (Admin) → Backend generates token & sends email with URL
2. **Open URL in Browser** → Frontend shows login page (no authentication required yet)
3. **Employee Login/Register** → Creates employee user and returns JWT token
4. **Access Onboarding Form** → Uses JWT token + onboarding token to save sections
5. **Submit Onboarding** → Expires the onboarding link

---

## Backend Endpoints

### 1. Check Onboarding Token (No Login Required)
**Route:** `GET /api/onboarding-link/check/:token`

**Purpose:** Validate that the onboarding token exists and is not expired. This endpoint does NOT require authentication, allowing the frontend to show the login page.

**Response (Valid Token):**
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

**Response (Invalid Token):**
```json
{
  "success": false,
  "message": "Invalid onboarding link",
  "isValid": false
}
```

---

### 2. Employee Login/Register
**Route:** `POST /api/onboarding-link/login`

**Request Body:**
```json
{
  "token": "acfb016d0facab84e6336d6e8c864d4ebb2f72f2047f3e59fac6dc4eaf352a6b",
  "email": "fiproullaffuda-5874@yopmail.com",
  "password": "Employee@1234"
}
```

**Purpose:** 
- If employee user doesn't exist → Creates account with provided password
- If employee user exists → Verifies password and logs in
- Returns JWT token for subsequent requests

**Response (Success):**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "employee": {
    "id": "user_id_here",
    "firstName": "Siri",
    "lastName": "Vennela",
    "email": "fiproullaffuda-5874@yopmail.com",
    "role": "employee"
  },
  "onboardingToken": "acfb016d0facab84e6336d6e8c864d4ebb2f72f2047f3e59fac6dc4eaf352a6b"
}
```

**Response (Invalid Email):**
```json
{
  "success": false,
  "message": "Email does not match the onboarding link"
}
```

**Response (Invalid Password):**
```json
{
  "success": false,
  "message": "Invalid password"
}
```

---

### 3. Validate Link & Get Progress (After Login)
**Route:** `GET /api/onboarding-link/validate/:token`

**Headers Required:**
```
Authorization: Bearer {jwt_token_from_login}
```

**Purpose:** Get existing onboarding data and progress after login

**Response:**
```json
{
  "success": true,
  "isExpired": false,
  "draftId": "DRAFT-1234567890-abcd",
  "email": "fiproullaffuda-5874@yopmail.com",
  "progress": {
    "token": "acfb016d0facab84e6336d6e8c864d4ebb2f72f2047f3e59fac6dc4eaf352a6b",
    "draftId": "DRAFT-1234567890-abcd",
    "email": "fiproullaffuda-5874@yopmail.com",
    "firstName": "Siri",
    "lastName": "Vennela",
    "currentSection": "personal",
    "personal": true,
    "pf": false,
    "academic": false,
    "experience": false,
    "family": false,
    "declaration": false,
    "isFullyCompleted": false,
    "completionPercentage": 0,
    "nextSection": "personal"
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

### 4. Save Onboarding Section (After Login)
**Route:** `POST /api/onboarding-link/save/:token/:section`

**Headers Required:**
```
Authorization: Bearer {jwt_token_from_login}
```

**URL Parameters:**
- `token`: Onboarding token
- `section`: One of [personal, pf, academic, experience, family, declaration]

**Request Body:**
```json
{
  "firstName": "Siri",
  "lastName": "Vennela",
  "dateOfBirth": "1995-05-15",
  // ... other section-specific fields
}
```

**Response:**
```json
{
  "success": true,
  "message": "Section saved successfully",
  "section": "personal",
  "data": { /* saved data */ }
}
```

---

### 5. Submit Declaration (Final Step)
**Route:** `POST /api/onboarding-link/submit-declaration/:token`

**Headers Required:**
```
Authorization: Bearer {jwt_token_from_login}
```

**Request Body:**
```json
{
  "declarationAccepted": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Onboarding completed successfully",
  "token": "acfb016d0facab84e6336d6e8c864d4ebb2f72f2047f3e59fac6dc4eaf352a6b"
}
```

---

## Frontend Implementation Flow

### Step 1: Parse URL Token
```javascript
// Extract token from URL: /onboarding/TOKEN
const token = window.location.pathname.split('/').pop();
```

### Step 2: Validate Token (No Auth Required)
```javascript
async function validateToken(token) {
  const response = await fetch(
    `https://api.example.com/api/onboarding-link/check/${token}`
  );
  
  if (!response.ok) {
    // Show error: "Invalid onboarding link"
    return null;
  }
  
  const data = await response.json();
  
  if (data.isExpired) {
    // Show error: "Link has expired"
    return null;
  }
  
  // Token is valid, show login form
  return data;
}
```

### Step 3: Show Login Form
```javascript
// Display login form with pre-filled email
const loginForm = `
  <form>
    <input type="email" value="${data.email}" disabled />
    <input type="password" placeholder="Enter password" id="password" />
    <button onclick="handleLogin()">Login</button>
  </form>
`;
```

### Step 4: Handle Login
```javascript
async function handleLogin(token, email, password) {
  const response = await fetch(
    'https://api.example.com/api/onboarding-link/login',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, email, password })
    }
  );
  
  if (!response.ok) {
    // Show error: "Invalid password" or other error
    return null;
  }
  
  const data = await response.json();
  
  // Store tokens
  localStorage.setItem('jwtToken', data.token);
  localStorage.setItem('onboardingToken', data.onboardingToken);
  
  // Redirect to onboarding form
  window.location.href = '/onboarding-form';
}
```

### Step 5: Access Onboarding Form
```javascript
async function loadOnboardingForm(onboardingToken) {
  const jwtToken = localStorage.getItem('jwtToken');
  
  const response = await fetch(
    `https://api.example.com/api/onboarding-link/validate/${onboardingToken}`,
    {
      headers: {
        'Authorization': `Bearer ${jwtToken}`
      }
    }
  );
  
  const data = await response.json();
  
  // Load form with data.progress.currentSection
  // Load existing data from data.existingData
}
```

### Step 6: Save Section
```javascript
async function saveSection(onboardingToken, section, sectionData) {
  const jwtToken = localStorage.getItem('jwtToken');
  
  const response = await fetch(
    `https://api.example.com/api/onboarding-link/save/${onboardingToken}/${section}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwtToken}`
      },
      body: JSON.stringify(sectionData)
    }
  );
  
  return await response.json();
}
```

### Step 7: Submit Final Declaration
```javascript
async function submitOnboarding(onboardingToken) {
  const jwtToken = localStorage.getItem('jwtToken');
  
  const response = await fetch(
    `https://api.example.com/api/onboarding-link/submit-declaration/${onboardingToken}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwtToken}`
      },
      body: JSON.stringify({ declarationAccepted: true })
    }
  );
  
  const data = await response.json();
  
  if (data.success) {
    // Show success message
    // Redirect to thank you page
  }
}
```

---

## Postman Testing Guide

### 1. Test: Check Onboarding Token
```
GET /api/onboarding-link/check/acfb016d0facab84e6336d6e8c864d4ebb2f72f2047f3e59fac6dc4eaf352a6b
```
No headers needed.

### 2. Test: Employee Login
```
POST /api/onboarding-link/login
Content-Type: application/json

{
  "token": "acfb016d0facab84e6336d6e8c864d4ebb2f72f2047f3e59fac6dc4eaf352a6b",
  "email": "fiproullaffuda-5874@yopmail.com",
  "password": "Employee@1234"
}
```

Copy the `token` from response.

### 3. Test: Validate Link (After Login)
```
GET /api/onboarding-link/validate/acfb016d0facab84e6336d6e8c864d4ebb2f72f2047f3e59fac6dc4eaf352a6b

Headers:
Authorization: Bearer {jwt_token_from_login}
```

### 4. Test: Save Personal Section
```
POST /api/onboarding-link/save/acfb016d0facab84e6336d6e8c864d4ebb2f72f2047f3e59fac6dc4eaf352a6b/personal

Headers:
Authorization: Bearer {jwt_token_from_login}
Content-Type: application/json

{
  "firstName": "Siri",
  "lastName": "Vennela",
  "dateOfBirth": "1995-05-15",
  "mobileNumber": "9876543210",
  "gender": "Female"
}
```

---

## Summary

| Step | Endpoint | Auth Required | Purpose |
|------|----------|---------------|---------|
| 1 | `GET /check/:token` | ❌ No | Validate token, show login |
| 2 | `POST /login` | ❌ No | Employee login/register |
| 3 | `GET /validate/:token` | ✅ Yes (JWT) | Load onboarding form |
| 4 | `POST /save/:token/:section` | ✅ Yes (JWT) | Save section data |
| 5 | `POST /submit-declaration/:token` | ✅ Yes (JWT) | Complete onboarding |

This ensures employees can:
- Access the onboarding URL (shows login page)
- Login with their password
- Complete the onboarding form securely
- Submit final declaration
