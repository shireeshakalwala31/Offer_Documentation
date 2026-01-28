# 🔗 Onboarding Link System - Complete Guide

## 📋 Overview

This system allows HR to generate unique onboarding links for candidates. The link:
- ✅ Works multiple times (resumable)
- ✅ Expires ONLY when 100% complete (Declaration submitted)
- ✅ Saves partial progress automatically
- ✅ Tracks completion status for each section

## 🏗️ Architecture

### Models Created:
1. **OnboardingLink** - Tracks generated links and expiry status
2. **OnboardingProgress** - Tracks section-wise completion
3. **EmployeeMaster** - Stores final merged data
4. **Temp Models** - TempPersonal, TempPF, TempAcademic, TempExperience, TempFamily, TempDeclaration

### 6 Sections:
1. Personal Information
2. PF Details
3. Academic Details
4. Experience Details
5. Family Details
6. Declaration (Final step that expires link)

---

## 🚀 API Endpoints

### Base URL: `/api/onboarding-link`

---

### 1️⃣ Generate Onboarding Link (Admin Only)

**Endpoint:** `POST /api/onboarding-link/generate`

**Headers:**
```json
{
  "Authorization": "Bearer <admin_token>"
}
```

**Request Body:**
```json
{
  "email": "candidate@example.com",
  "candidateName": "John Doe"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Onboarding link generated successfully",
  "token": "a1b2c3d4e5f6...",
  "url": "http://localhost:3000/onboarding/a1b2c3d4e5f6...",
  "email": "candidate@example.com",
  "draftId": "DRAFT-1234567890-abcd"
}
```

**Email Sent:**
- Candidate receives email with onboarding link
- Link format: `{PUBLIC_WEB_URL}/onboarding/{token}`

---

### 2️⃣ Validate Link & Get Progress (Public)

**Endpoint:** `GET /api/onboarding-link/validate/:token`

**Example:** `GET /api/onboarding-link/validate/a1b2c3d4e5f6...`

**Response (Link Active):**
```json
{
  "success": true,
  "message": "Link is valid",
  "isExpired": false,
  "progress": {
    "personal": {
      "completed": true,
      "completedAt": "2024-01-15T10:30:00.000Z"
    },
    "pf": {
      "completed": false,
      "completedAt": null
    },
    "academic": {
      "completed": false,
      "completedAt": null
    },
    "experience": {
      "completed": false,
      "completedAt": null
    },
    "family": {
      "completed": false,
      "completedAt": null
    },
    "declaration": {
      "completed": false,
      "completedAt": null
    },
    "isFullyCompleted": false,
    "currentSection": "pf",
    "completionPercentage": 17,
    "nextSection": "pf"
  },
  "draftId": "DRAFT-1234567890-abcd",
  "email": "candidate@example.com",
  "existingData": {
    "personal": { /* existing personal data */ },
    "pf": null,
    "academic": null,
    "experience": null,
    "family": null,
    "declaration": null
  }
}
```

**Response (Link Expired):**
```json
{
  "success": false,
  "message": "This onboarding link has expired. Your onboarding is complete.",
  "isExpired": true
}
```

---

### 3️⃣ Save Section (Partial Save - Public)

**Endpoint:** `POST /api/onboarding-link/save/:token/:section`

**Sections:** `personal` | `pf` | `academic` | `experience` | `family` | `declaration`

**Example:** `POST /api/onboarding-link/save/a1b2c3d4e5f6.../personal`

**Request Body (Personal Section Example):**
```json
{
  "email": "candidate@example.com",
  "firstName": "JOHN",
  "lastName": "DOE",
  "dateOfBirth": "1995-05-15",
  "gender": "Male",
  "maritalStatus": "Single",
  "presentAddress": "123 Main St",
  "presentCity": "Mumbai",
  "presentState": "Maharashtra",
  "presentPhone": "9876543210",
  "presentPincode": "400001",
  "permanentAddress": "123 Main St",
  "permanentCity": "Mumbai",
  "permanentState": "Maharashtra",
  "permanentPincode": "400001",
  "aadhaar": "123456789012",
  "pan": "ABCDE1234F"
}
```

**Response:**
```json
{
  "success": true,
  "message": "personal section saved successfully",
  "section": "personal",
  "completed": true,
  "nextSection": "pf",
  "completionPercentage": 17,
  "data": { /* saved data */ }
}
```

---

### 4️⃣ Submit Declaration (Final Step - Expires Link)

**Endpoint:** `POST /api/onboarding-link/submit-declaration/:token`

**Example:** `POST /api/onboarding-link/submit-declaration/a1b2c3d4e5f6...`

**Request Body:**
```json
{
  "keepOriginalCertificates": true,
  "willingServiceAgreement": true,
  "willingToWorkAnywhere": true,
  "agreeCompanyTerms": true,
  "doYouSmoke": false,
  "areYouAlcoholic": false,
  "medicallyFit": true,
  "convictedInCourt": false,
  "convictedRemarks": "",
  "haveProfessionalMembership": false,
  "membershipDetails": "",
  "declarationName": "John Doe",
  "declarationDate": "2024-01-15"
}
```

**Response (Success - Link Expired):**
```json
{
  "success": true,
  "message": "Onboarding completed successfully! Your link has been expired.",
  "isFullyCompleted": true,
  "completionPercentage": 100,
  "submittedAt": "2024-01-15T12:00:00.000Z",
  "draftId": "DRAFT-1234567890-abcd"
}
```

**Response (Missing Sections):**
```json
{
  "success": false,
  "message": "Please complete all previous sections before submitting declaration",
  "missingSection": "family"
}
```

---

### 5️⃣ Get Progress (Public)

**Endpoint:** `GET /api/onboarding-link/progress/:token`

**Example:** `GET /api/onboarding-link/progress/a1b2c3d4e5f6...`

**Response:**
```json
{
  "success": true,
  "progress": {
    "personal": { "completed": true, "completedAt": "..." },
    "pf": { "completed": true, "completedAt": "..." },
    "academic": { "completed": true, "completedAt": "..." },
    "experience": { "completed": true, "completedAt": "..." },
    "family": { "completed": true, "completedAt": "..." },
    "declaration": { "completed": false, "completedAt": null },
    "isFullyCompleted": false,
    "currentSection": "declaration",
    "completionPercentage": 83,
    "nextSection": "declaration"
  },
  "isExpired": false,
  "email": "candidate@example.com",
  "draftId": "DRAFT-1234567890-abcd"
}
```

---

### 6️⃣ Get All Onboarding Links (Admin Only)

**Endpoint:** `GET /api/onboarding-link/all`

**Headers:**
```json
{
  "Authorization": "Bearer <admin_token>"
}
```

**Query Parameters:**
- `page` (default: 1)
- `limit` (default: 10)
- `status` (all | active | expired)

**Example:** `GET /api/onboarding-link/all?page=1&limit=10&status=active`

**Response:**
```json
{
  "success": true,
  "page": 1,
  "limit": 10,
  "total": 25,
  "totalPages": 3,
  "data": [
    {
      "_id": "...",
      "email": "candidate1@example.com",
      "token": "a1b2c3...",
      "isExpired": false,
      "createdAt": "2024-01-15T10:00:00.000Z",
      "generatedBy": {
        "name": "HR Admin",
        "email": "hr@company.com"
      },
      "progress": {
        "completionPercentage": 67,
        "currentSection": "family",
        "isFullyCompleted": false
      }
    }
  ]
}
```

---

## 🔄 Complete Flow Example

### Step 1: HR Generates Link
```bash
POST /api/onboarding-link/generate
{
  "email": "john@example.com",
  "candidateName": "John Doe"
}
```

### Step 2: Candidate Opens Link
```bash
GET /api/onboarding-link/validate/abc123...
# Returns: Link valid, 0% complete, start with "personal"
```

### Step 3: Candidate Fills Personal Section
```bash
POST /api/onboarding-link/save/abc123.../personal
{ /* personal data */ }
# Returns: 17% complete, next section: "pf"
```

### Step 4: Candidate Closes Browser (Progress Saved!)

### Step 5: Candidate Reopens Link Next Day
```bash
GET /api/onboarding-link/validate/abc123...
# Returns: Link still valid, 17% complete, resume from "pf"
```

### Step 6: Candidate Completes Remaining Sections
```bash
POST /api/onboarding-link/save/abc123.../pf
POST /api/onboarding-link/save/abc123.../academic
POST /api/onboarding-link/save/abc123.../experience
POST /api/onboarding-link/save/abc123.../family
```

### Step 7: Candidate Submits Declaration (Final Step)
```bash
POST /api/onboarding-link/submit-declaration/abc123...
# Returns: 100% complete, link EXPIRED
```

### Step 8: Candidate Tries to Reopen Link
```bash
GET /api/onboarding-link/validate/abc123...
# Returns: "Link expired. Your onboarding is complete."
```

---

## 🎨 Frontend Integration Guide

### 1. Onboarding Page Component

```javascript
// OnboardingPage.jsx
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

function OnboardingPage() {
  const { token } = useParams();
  const [progress, setProgress] = useState(null);
  const [isExpired, setIsExpired] = useState(false);
  const [currentSection, setCurrentSection] = useState('personal');

  useEffect(() => {
    validateLink();
  }, [token]);

  const validateLink = async () => {
    try {
      const response = await fetch(`/api/onboarding-link/validate/${token}`);
      const data = await response.json();
      
      if (data.isExpired) {
        setIsExpired(true);
        return;
      }
      
      setProgress(data.progress);
      setCurrentSection(data.progress.nextSection || 'personal');
    } catch (error) {
      console.error('Validation error:', error);
    }
  };

  const saveSection = async (section, formData) => {
    try {
      const response = await fetch(`/api/onboarding-link/save/${token}/${section}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      
      if (data.success) {
        setProgress(prev => ({
          ...prev,
          [section]: { completed: true },
          completionPercentage: data.completionPercentage
        }));
        setCurrentSection(data.nextSection);
      }
    } catch (error) {
      console.error('Save error:', error);
    }
  };

  const submitDeclaration = async (formData) => {
    try {
      const response = await fetch(`/api/onboarding-link/submit-declaration/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert('Onboarding completed! Link has been expired.');
        // Redirect to success page
      }
    } catch (error) {
      console.error('Submit error:', error);
    }
  };

  if (isExpired) {
    return <div>This link has expired. Your onboarding is complete.</div>;
  }

  return (
    <div>
      <h1>Employee Onboarding</h1>
      <ProgressBar percentage={progress?.completionPercentage || 0} />
      
      {currentSection === 'personal' && <PersonalForm onSave={(data) => saveSection('personal', data)} />}
      {currentSection === 'pf' && <PFForm onSave={(data) => saveSection('pf', data)} />}
      {currentSection === 'academic' && <AcademicForm onSave={(data) => saveSection('academic', data)} />}
      {currentSection === 'experience' && <ExperienceForm onSave={(data) => saveSection('experience', data)} />}
      {currentSection === 'family' && <FamilyForm onSave={(data) => saveSection('family', data)} />}
      {currentSection === 'declaration' && <DeclarationForm onSubmit={submitDeclaration} />}
    </div>
  );
}
```

---

## 🔐 Security Features

1. **Unique Tokens**: Cryptographically secure random tokens
2. **Email Validation**: Links tied to specific email addresses
3. **Expiry Control**: Links expire only after 100% completion
4. **Admin Protection**: Link generation requires admin authentication
5. **Progress Tracking**: Prevents skipping sections

---

## 📊 Database Schema

### OnboardingLink
```javascript
{
  email: String,
  token: String (unique, indexed),
  isExpired: Boolean,
  expiresAt: Date,
  generatedBy: ObjectId (ref: HrAdmin),
  createdAt: Date,
  updatedAt: Date
}
```

### OnboardingProgress
```javascript
{
  token: String (unique, indexed),
  draftId: String (indexed),
  email: String,
  personal: { completed: Boolean, completedAt: Date },
  pf: { completed: Boolean, completedAt: Date },
  academic: { completed: Boolean, completedAt: Date },
  experience: { completed: Boolean, completedAt: Date },
  family: { completed: Boolean, completedAt: Date },
  declaration: { completed: Boolean, completedAt: Date },
  isFullyCompleted: Boolean,
  completedAt: Date,
  currentSection: String,
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🧪 Testing Guide

### Test Case 1: Generate Link
```bash
curl -X POST http://localhost:5000/api/onboarding-link/generate \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","candidateName":"Test User"}'
```

### Test Case 2: Validate Link
```bash
curl http://localhost:5000/api/onboarding-link/validate/YOUR_TOKEN
```

### Test Case 3: Save Personal Section
```bash
curl -X POST http://localhost:5000/api/onboarding-link/save/YOUR_TOKEN/personal \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","firstName":"JOHN","lastName":"DOE","gender":"Male"}'
```

### Test Case 4: Submit Declaration
```bash
curl -X POST http://localhost:5000/api/onboarding-link/submit-declaration/YOUR_TOKEN \
  -H "Content-Type: application/json" \
  -d '{"agreeCompanyTerms":true,"declarationName":"John Doe"}'
```

### Test Case 5: Try Expired Link
```bash
curl http://localhost:5000/api/onboarding-link/validate/YOUR_TOKEN
# Should return: "Link expired"
```

---

## ✅ Summary

**What We Built:**
1. ✅ Link generation system for candidates
2. ✅ Progress tracking with 6 sections
3. ✅ Partial save & resume functionality
4. ✅ Link expires ONLY after Declaration submission
5. ✅ Admin dashboard to view all links
6. ✅ Email notification system

**Key Features:**
- 🔄 Resumable onboarding
- 📊 Real-time progress tracking
- 🔒 Secure token-based access
- 📧 Automatic email notifications
- 🎯 Section-wise completion tracking
- ⏰ Smart expiry (only after 100% completion)

**Files Created:**
1. `models/OnboardingLink.js`
2. `models/OnboardingProgress.js`
3. `controllers/onboardingLinkController.js`
4. `routes/onboardingLinkRoutes.js`

**Files Modified:**
1. `server.js` (added route)

---

## 🚀 Next Steps

1. Test all endpoints using Postman/Thunder Client
2. Integrate with frontend
3. Customize email templates in `services/emailService.js`
4. Add file upload support if needed
5. Set up environment variable `PUBLIC_WEB_URL` for production

---

**Need Help?** Check the code comments or reach out to the development team!
