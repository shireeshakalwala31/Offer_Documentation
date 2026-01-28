# 🚀 Quick Start Guide - Onboarding Link System

## ⚡ Get Started in 5 Minutes

### Step 1: Start Your Server

```bash
npm install
npm start
# Server should run on http://localhost:5000
```

### Step 2: Test with Postman/Thunder Client

#### 🔹 Test 1: Generate Link (Admin)

```http
POST http://localhost:5000/api/onboarding-link/generate
Content-Type: application/json
Authorization: Bearer YOUR_ADMIN_TOKEN

{
  "email": "test@example.com",
  "candidateName": "Test User"
}
```

**Expected Response:**
```json
{
  "success": true,
  "token": "abc123...",
  "url": "http://localhost:3000/onboarding/abc123...",
  "draftId": "DRAFT-..."
}
```

**📝 Copy the `token` from response!**

---

#### 🔹 Test 2: Validate Link

```http
GET http://localhost:5000/api/onboarding-link/validate/YOUR_TOKEN_HERE
```

**Expected Response:**
```json
{
  "success": true,
  "isExpired": false,
  "progress": {
    "completionPercentage": 0,
    "nextSection": "personal"
  }
}
```

---

#### 🔹 Test 3: Save Personal Section

```http
POST http://localhost:5000/api/onboarding-link/save/YOUR_TOKEN_HERE/personal
Content-Type: application/json

{
  "email": "test@example.com",
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

**Expected Response:**
```json
{
  "success": true,
  "message": "personal section saved successfully",
  "completionPercentage": 17,
  "nextSection": "pf"
}
```

---

#### 🔹 Test 4: Check Progress

```http
GET http://localhost:5000/api/onboarding-link/progress/YOUR_TOKEN_HERE
```

**Expected Response:**
```json
{
  "success": true,
  "progress": {
    "personal": { "completed": true },
    "completionPercentage": 17,
    "nextSection": "pf"
  }
}
```

---

#### 🔹 Test 5: Save Remaining Sections

**PF Section:**
```http
POST http://localhost:5000/api/onboarding-link/save/YOUR_TOKEN_HERE/pf
Content-Type: application/json

{
  "pfNumber": "MH/MUM/1234567",
  "uanNumber": "123456789012"
}
```

**Academic Section:**
```http
POST http://localhost:5000/api/onboarding-link/save/YOUR_TOKEN_HERE/academic
Content-Type: application/json

{
  "qualifications": [
    {
      "degree": "B.Tech",
      "institution": "Engineering College",
      "yearOfPassing": "2016",
      "percentage": 75.5,
      "specialization": "Computer Science"
    }
  ]
}
```

**Experience Section:**
```http
POST http://localhost:5000/api/onboarding-link/save/YOUR_TOKEN_HERE/experience
Content-Type: application/json

{
  "experiences": [
    {
      "companyName": "Tech Solutions",
      "designation": "Developer",
      "fromDate": "2016-07-01",
      "toDate": "2019-12-31",
      "ctc": "500000",
      "reasonForLeaving": "Better opportunity"
    }
  ]
}
```

**Family Section:**
```http
POST http://localhost:5000/api/onboarding-link/save/YOUR_TOKEN_HERE/family
Content-Type: application/json

{
  "familyMembers": [
    {
      "name": "Robert Doe",
      "relationship": "Father",
      "dateOfBirth": "1965-08-10",
      "occupation": "Business"
    }
  ]
}
```

---

#### 🔹 Test 6: Submit Declaration (Final - Expires Link)

```http
POST http://localhost:5000/api/onboarding-link/submit-declaration/YOUR_TOKEN_HERE
Content-Type: application/json

{
  "keepOriginalCertificates": true,
  "willingServiceAgreement": true,
  "willingToWorkAnywhere": true,
  "agreeCompanyTerms": true,
  "doYouSmoke": false,
  "areYouAlcoholic": false,
  "medicallyFit": true,
  "convictedInCourt": false,
  "declarationName": "John Doe",
  "declarationDate": "2024-01-15"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Onboarding completed successfully! Your link has been expired.",
  "isFullyCompleted": true,
  "completionPercentage": 100
}
```

---

#### 🔹 Test 7: Verify Link Expired

```http
GET http://localhost:5000/api/onboarding-link/validate/YOUR_TOKEN_HERE
```

**Expected Response:**
```json
{
  "success": false,
  "message": "This onboarding link has expired. Your onboarding is complete.",
  "isExpired": true
}
```

✅ **Success! Link expired after 100% completion!**

---

## 🎯 Testing Checklist

- [ ] Generate link successfully
- [ ] Validate link (should be active)
- [ ] Save personal section (17% complete)
- [ ] Check progress (shows 17%)
- [ ] Save PF section (33% complete)
- [ ] Save academic section (50% complete)
- [ ] Save experience section (67% complete)
- [ ] Save family section (83% complete)
- [ ] Submit declaration (100% complete, link expires)
- [ ] Validate link again (should be expired)

---

## 🔧 Troubleshooting

### Issue: "Authorization failed"
**Solution:** Make sure you have a valid admin token. Generate one by logging in as admin first.

### Issue: "Token not found"
**Solution:** Copy the exact token from the generate response. Don't modify it.

### Issue: "Email not sent"
**Solution:** Configure SMTP settings in `.env` file or check `services/emailService.js`

### Issue: "MongoDB connection error"
**Solution:** Check your `MONGO_URI` in `.env` file

---

## 📱 Admin Dashboard Test

```http
GET http://localhost:5000/api/onboarding-link/all?status=active
Authorization: Bearer YOUR_ADMIN_TOKEN
```

**Expected Response:**
```json
{
  "success": true,
  "total": 5,
  "data": [
    {
      "email": "test@example.com",
      "token": "abc123...",
      "isExpired": false,
      "progress": {
        "completionPercentage": 67,
        "currentSection": "family"
      }
    }
  ]
}
```

---

## 🎨 Frontend URL Format

When integrating with frontend, the link format should be:

```
http://localhost:3000/onboarding/{token}
```

Example:
```
http://localhost:3000/onboarding/a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
```

Set this in your `.env`:
```env
PUBLIC_WEB_URL=http://localhost:3000
```

---

## 📊 Monitor in MongoDB

Check these collections:
1. `onboardinglinks` - Generated links
2. `onboardingprogresses` - Progress tracking
3. `employeemasters` - Final merged data
4. `temppersonals`, `temppfs`, etc. - Section data

---

## 🎓 What to Expect

### After Personal Section Save:
- ✅ Data saved in `temppersonals` collection
- ✅ Progress updated to 17%
- ✅ Next section: "pf"

### After Declaration Submit:
- ✅ Data saved in `tempdeclarations` collection
- ✅ Progress updated to 100%
- ✅ Link marked as expired
- ✅ EmployeeMaster status: "submitted"

---

## 🚀 Ready for Production?

1. ✅ All tests passing
2. ✅ Email service configured
3. ✅ Environment variables set
4. ✅ Frontend integrated
5. ✅ Database backups enabled

---

## 📚 Need More Help?

- **Full API Docs:** `ONBOARDING_LINK_GUIDE.md`
- **Implementation Details:** `IMPLEMENTATION_SUMMARY.md`
- **API Examples:** `API_TESTING_EXAMPLES.json`
- **Task Tracker:** `TODO.md`

---

## 💡 Pro Tips

1. **Use Postman Collections:** Import `API_TESTING_EXAMPLES.json`
2. **Save Token:** Keep the token handy for all subsequent requests
3. **Check Logs:** Monitor console for any errors
4. **Test Resume:** Save partial data, close, then validate again
5. **Admin View:** Use admin endpoint to see all candidates' progress

---

**Happy Testing! 🎉**

If everything works, you're ready to integrate with your frontend!
