# Changes Summary - Onboarding Link API Update

## Date: January 28, 2026

## Issue Fixed
- **Problem**: API was returning "403 Forbidden - Access denied: Admin only" error
- **Root Cause**: User was calling the protected endpoint without authentication token
- **Additional Issue**: API was accepting `candidateName` instead of `firstName` and `lastName` separately

## Solution Implemented

### 1. Authentication Fix
- Created comprehensive authentication guide (`POSTMAN_AUTHENTICATION_GUIDE.md`)
- Documented how to login and use admin token
- Provided step-by-step Postman setup instructions

### 2. API Structure Update
Changed the API to accept `firstName` and `lastName` instead of `candidateName`

## Files Modified

### 1. `models/OnboardingLink.js`
**Changes:**
- Added `firstName` field (required, trimmed)
- Added `lastName` field (required, trimmed)

**Before:**
```javascript
{
  email: { type: String, required: true },
  token: { type: String, required: true },
  // ... other fields
}
```

**After:**
```javascript
{
  email: { type: String, required: true },
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  token: { type: String, required: true },
  // ... other fields
}
```

### 2. `models/OnboardingProgress.js`
**Changes:**
- Added `firstName` field (required, trimmed)
- Added `lastName` field (required, trimmed)

**Before:**
```javascript
{
  token: { type: String, required: true },
  draftId: { type: String, required: true },
  email: { type: String, required: true },
  // ... other fields
}
```

**After:**
```javascript
{
  token: { type: String, required: true },
  draftId: { type: String, required: true },
  email: { type: String, required: true },
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  // ... other fields
}
```

### 3. `controllers/onboardingLinkController.js`
**Changes in `generateOnboardingLink` function:**

1. **Request Body Validation:**
   - Changed from accepting `candidateName` to `firstName` and `lastName`
   - Added validation for both firstName and lastName

**Before:**
```javascript
const { email, candidateName } = req.body;

if (!email) {
  return res.status(400).json({
    success: false,
    message: "Email is required"
  });
}
```

**After:**
```javascript
const { email, firstName, lastName } = req.body;

if (!email) {
  return res.status(400).json({
    success: false,
    message: "Email is required"
  });
}

if (!firstName || !lastName) {
  return res.status(400).json({
    success: false,
    message: "First name and last name are required"
  });
}
```

2. **Database Creation:**
   - Updated OnboardingLink creation to include firstName and lastName
   - Updated OnboardingProgress creation to include firstName and lastName

**Before:**
```javascript
const newLink = await OnboardingLink.create({
  email,
  token,
  isExpired: false,
  generatedBy: req.admin?._id || null,
  expiresAt: null
});

await OnboardingProgress.create({
  token,
  draftId,
  email,
  currentSection: "personal"
});
```

**After:**
```javascript
const newLink = await OnboardingLink.create({
  email,
  firstName,
  lastName,
  token,
  isExpired: false,
  generatedBy: req.admin?._id || null,
  expiresAt: null
});

await OnboardingProgress.create({
  token,
  draftId,
  email,
  firstName,
  lastName,
  currentSection: "personal"
});
```

3. **Email Template:**
   - Updated email greeting to use firstName and lastName

**Before:**
```html
<p>Dear ${candidateName || "Candidate"},</p>
```

**After:**
```html
<p>Dear ${firstName} ${lastName},</p>
```

4. **Response Data:**
   - Added firstName and lastName to success response

**Before:**
```javascript
return res.status(201).json({
  success: true,
  message: "Onboarding link generated successfully",
  token,
  url: onboardingUrl,
  email,
  draftId
});
```

**After:**
```javascript
return res.status(201).json({
  success: true,
  message: "Onboarding link generated successfully",
  token,
  url: onboardingUrl,
  email,
  firstName,
  lastName,
  draftId
});
```

### 4. `POSTMAN_AUTHENTICATION_GUIDE.md` (New File)
**Created comprehensive guide with:**
- Admin login instructions
- Token usage in Postman
- Request/response examples
- Troubleshooting section
- cURL command examples
- Postman collection JSON

**Updated request body format:**
```json
{
  "email": "lulloipattissei-9881@yopmail.com",
  "firstName": "shireesha",
  "lastName": "kalwala"
}
```

## API Changes Summary

### Endpoint: `POST /api/onboarding-link/generate`

**Authentication:** Required (Admin only)
- Must include `Authorization: Bearer <token>` header
- Token obtained from `POST /api/offer/login`

**Request Body (OLD):**
```json
{
  "email": "user@example.com",
  "candidateName": "John Doe"
}
```

**Request Body (NEW):**
```json
{
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response (NEW):**
```json
{
  "success": true,
  "message": "Onboarding link generated successfully",
  "token": "abc123...",
  "url": "http://localhost:3000/onboarding/abc123...",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "draftId": "DRAFT-1234567890-abc123"
}
```

## How to Use (Quick Start)

### Step 1: Login as Admin
```bash
POST https://offer-documentation.onrender.com/api/offer/login

Body:
{
  "email": "lufrurefrowa-6424@yopmail.com",
  "password": "Admin@1234"
}
```

### Step 2: Copy Token from Response

### Step 3: Generate Onboarding Link
```bash
POST https://offer-documentation.onrender.com/api/onboarding-link/generate

Headers:
Authorization: Bearer YOUR_TOKEN_HERE

Body:
{
  "email": "candidate@example.com",
  "firstName": "John",
  "lastName": "Doe"
}
```

## Breaking Changes

⚠️ **IMPORTANT**: This is a breaking change for existing API consumers

**What changed:**
- Request body parameter `candidateName` is now split into `firstName` and `lastName`
- Both `firstName` and `lastName` are now required fields

**Migration Guide:**
If you were using:
```json
{
  "email": "user@example.com",
  "candidateName": "John Doe"
}
```

You must now use:
```json
{
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe"
}
```

## Testing Recommendations

1. **Test Admin Login:**
   - Verify login with default credentials works
   - Confirm token is returned

2. **Test Link Generation:**
   - Test with valid firstName and lastName
   - Test without firstName (should fail with 400)
   - Test without lastName (should fail with 400)
   - Test without token (should fail with 401/403)

3. **Test Email:**
   - Verify email is sent with correct name format
   - Check email greeting shows "Dear FirstName LastName"

4. **Test Existing Links:**
   - Verify existing links still work (if any)
   - Check backward compatibility

## Database Impact

**New Fields Added:**
- `OnboardingLink.firstName` (required)
- `OnboardingLink.lastName` (required)
- `OnboardingProgress.firstName` (required)
- `OnboardingProgress.lastName` (required)

**Note:** Existing records in the database will need to be migrated or will fail validation when accessed.

## Next Steps

1. ✅ Update API documentation
2. ✅ Test the changes in Postman
3. ⏳ Notify frontend team about API changes
4. ⏳ Update any existing API consumers
5. ⏳ Consider database migration for existing records

## Support

For issues or questions:
- Refer to `POSTMAN_AUTHENTICATION_GUIDE.md` for authentication help
- Check `ONBOARDING_LINK_GUIDE.md` for general onboarding flow
- Review `TESTING_REPORT.md` for test cases

---

**Last Updated:** January 28, 2026
**Updated By:** BLACKBOXAI
