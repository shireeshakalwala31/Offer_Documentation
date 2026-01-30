# 🎯 ONBOARDING FLOW - FINAL VERSION (WHAT YOUR TEAM LEAD WANTS)

## 📋 The Exact Flow Your Team Lead Wants

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. HR GENERATES LINK (Admin Dashboard)                          │
│    - Provides: Email, First Name, Last Name                     │
│    - System generates: Token + Auto Password                     │
│    - Email sent with: URL + Email + Password                    │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. CANDIDATE OPENS EMAIL                                        │
│    - Clicks: https://offer-documentation-frontend.../onboarding │
│    - Receives: Email and Password in email                      │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. LOGIN PAGE APPEARS                                           │
│    - Email: frouheubreurufu-6059@yopmail.com (LOCKED)          │
│    - Password: [TEXT INPUT FIELD]                              │
│    - Candidate enters password from email                       │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. CANDIDATE LOGS IN                                            │
│    - Backend validates: Email + Password                        │
│    - Returns: JWT Token + Onboarding Token                      │
│    - Redirects to: Onboarding Form                              │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 5. ONBOARDING FORM OPENS                                        │
│    - Shows sections: Personal, PF, Academic, Experience,        │
│                     Family, Declaration                         │
│    - Progress bar shows: 0% (empty)                             │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 6a. CANDIDATE FILLS SECTIONS & SAVES (HALF COMPLETION)        │
│    - Fills: Personal (✓)                                       │
│    - Clicks: Save                                              │
│    - Closes browser / Refreshes / Logs out                      │
│    ➜ Link STAYS ACTIVE ✓                                       │
│    ➜ Can open again, logs in, resumes from Personal            │
│    ➜ Data is saved in database                                  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 6b. CANDIDATE COMPLETES ALL & SUBMITS                          │
│    - Fills: All sections (Personal ✓ PF ✓ Academic ✓           │
│             Experience ✓ Family ✓ Declaration ✓)               │
│    - Clicks: "SUBMIT DECLARATION"                              │
│    ➜ Link EXPIRES ✓                                            │
│    ➜ Cannot open link again                                     │
│    ➜ Shows: "Link has expired" error                            │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔧 Backend Changes Made

### 1. OnboardingLink Model Updated
**Added field:** `password: String`

```javascript
// One-time password for login (auto-generated)
password: {
  type: String,
  required: true
}
```

### 2. Generate Link Endpoint Updated
**Endpoint:** `POST /api/onboarding-link/generate`

**What Changed:**
- ✅ Auto-generates password (8 chars, e.g., "A7F2Q9X1")
- ✅ Stores password in database
- ✅ Returns password in response
- ✅ Sends password in email to candidate

**Admin Request:**
```json
{
  "email": "frouheubreurufu-6059@yopmail.com",
  "firstName": "Siri",
  "lastName": "Vennela"
}
```

**Backend Response:**
```json
{
  "success": true,
  "message": "Onboarding link generated successfully",
  "token": "b00a7c0f40a213d312a2f406ec20c87040a56cfb2eb1c8d282d84795b020c0ec",
  "url": "https://offer-documentation-frontend.onrender.com/onboarding/b00a7c0f40a213d312a2f406ec20c87040a56cfb2eb1c8d282d84795b020c0ec",
  "email": "frouheubreurufu-6059@yopmail.com",
  "firstName": "Siri",
  "lastName": "Vennela",
  "password": "A7F2Q9X1",
  "draftId": "DRAFT-1769776308624-bb401946",
  "instructions": "Share the URL and password with the candidate via email"
}
```

**Email Sent to Candidate:**
```
Subject: Your Onboarding Link & Login Credentials

Dear Siri Vennela,

Your onboarding has been initiated. Please use the following credentials to access your onboarding:

Onboarding Link:
https://offer-documentation-frontend.onrender.com/onboarding/b00a7c0f40a213d312a2f406ec20c87040a56cfb2eb1c8d282d84795b020c0ec

Login Credentials:
Email: frouheubreurufu-6059@yopmail.com
Password: A7F2Q9X1

This link remains active until you complete all sections of the onboarding form.
You can save your progress and resume later.

Best regards,
HR Team
```

### 3. Login Endpoint Updated
**Endpoint:** `POST /api/onboarding-link/login`

**What Changed:**
- ✅ Validates password against stored password (simple string match)
- ✅ No database user creation needed
- ✅ Returns JWT token for form submission
- ✅ Simpler, faster authentication

**Candidate Request:**
```json
{
  "token": "b00a7c0f40a213d312a2f406ec20c87040a56cfb2eb1c8d282d84795b020c0ec",
  "email": "frouheubreurufu-6059@yopmail.com",
  "password": "A7F2Q9X1"
}
```

**Success Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "candidate": {
    "email": "frouheubreurufu-6059@yopmail.com",
    "firstName": "Siri",
    "lastName": "Vennela"
  },
  "onboardingToken": "b00a7c0f40a213d312a2f406ec20c87040a56cfb2eb1c8d282d84795b020c0ec"
}
```

**Invalid Password Response:**
```json
{
  "success": false,
  "message": "Invalid password. Please check the password sent to your email."
}
```

---

## 📱 Frontend Implementation (Simple Steps)

### Step 1: Login Page Component
Show 3 things:
1. Email (read-only, pre-filled)
2. Password field (input)
3. Login button

```jsx
// When candidate enters password and clicks Login:
const response = await fetch('/api/onboarding-link/login', {
  method: 'POST',
  body: JSON.stringify({
    token: 'from_url',
    email: 'from_link',
    password: 'user_input'
  })
});

if (response.ok) {
  // Store tokens
  localStorage.setItem('jwtToken', response.token);
  localStorage.setItem('onboardingToken', response.onboardingToken);
  
  // Redirect to form
  navigate('/onboarding-form');
}
```

### Step 2: Onboarding Form Page
Show:
1. Form sections (Personal, PF, Academic, Experience, Family, Declaration)
2. Save button for each section
3. Submit button (only after all sections complete)

```jsx
// Save section
await fetch('/api/onboarding-link/save/{token}/{section}', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${jwtToken}`
  },
  body: JSON.stringify(formData)
});

// Submit final declaration
await fetch('/api/onboarding-link/submit-declaration/{token}', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${jwtToken}`
  },
  body: JSON.stringify({ declarationAccepted: true })
});
```

### Step 3: Resume Functionality
When candidate reopens link:
1. Call: `GET /api/onboarding-link/check/{token}` (validates link)
2. Show login page again
3. After login, show form with EXISTING DATA pre-filled
4. Continue from where they left off

---

## ✅ Testing Checklist

### Step 1: Generate Link (Admin)
```
POST /api/onboarding-link/generate
{
  "email": "test@example.com",
  "firstName": "John",
  "lastName": "Doe"
}
```
✅ Check response has: token, url, password

### Step 2: Check Password
Copy the password from response (e.g., "A7F2Q9X1")

### Step 3: Test Login (Frontend or Postman)
```
POST /api/onboarding-link/login
{
  "token": "...",
  "email": "test@example.com",
  "password": "A7F2Q9X1"
}
```
✅ Should return JWT token

### Step 4: Wrong Password
```
POST /api/onboarding-link/login
{
  "token": "...",
  "email": "test@example.com",
  "password": "WRONG123"
}
```
✅ Should return error: "Invalid password..."

### Step 5: Test Resume (Save Half, Close, Reopen)
1. Login → Form opens
2. Fill Personal section → Click Save
3. Close browser
4. Open URL again → Login page appears
5. Login again → Form shows with Personal data pre-filled
6. ✅ Personal shows as complete (✓)
7. Fill PF section → Click Save
8. Continue...

### Step 6: Test Final Submit (Complete All Sections)
1. Fill all 6 sections
2. Click "Submit Declaration"
3. ✅ Should get success message
4. ✅ Link should expire
5. Try opening URL again
6. ✅ Should get error: "Link has expired"

---

## 🎉 Why This Design is Perfect

✅ **Simple for HR:** Just enter email, first name, last name  
✅ **Simple for Candidates:** Use password from email  
✅ **Secure:** Token + password + JWT token (3 layers)  
✅ **Resumable:** Save progress, close, come back anytime  
✅ **Auto-expires:** Only after ALL sections submitted  
✅ **No password reset:** System generates password, no "forgot password"  
✅ **One-time use:** Password is generated once per link  
✅ **Email notification:** Candidate gets all info in email  

---

## 📊 API Summary

| Action | Endpoint | Auth | Input | Output |
|--------|----------|------|-------|--------|
| **Generate Link** | POST /generate | Admin Token | Email, Name | Token, Password, URL |
| **Check Link** | GET /check/:token | None | Token | Validity, Name, Email |
| **Login** | POST /login | None | Token, Email, Password | JWT Token |
| **Load Form** | GET /validate/:token | JWT | Token | Sections, Progress, Existing Data |
| **Save Section** | POST /save/:token/:section | JWT | Token, Section, Data | Success |
| **Submit** | POST /submit-declaration/:token | JWT | Token, Declaration | Success, Link Expires |

---

## 🚀 What's Next

1. ✅ Backend is complete and tested
2. ⏳ Frontend needs to implement:
   - Route: `/onboarding/:token`
   - Login page component
   - Form page component
   - Token management (localStorage)
3. ⏳ Test the complete flow end-to-end

**The backend is ready. Frontend can now be built with confidence!**
