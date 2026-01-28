# ✅ FINAL TEST INSTRUCTIONS

## The middleware has been fixed! Now test it properly.

### What Was Fixed:
- Fixed indentation in `middleware/authMiddleware.js`
- Ensured `req.role` is properly set from the JWT token
- The `adminOnly` middleware now correctly checks `req.role === "admin"`

---

## 🧪 TEST NOW - Step by Step

### TEST 1: Admin Login

**Request:**
```
POST https://offer-documentation.onrender.com/api/offer/login

Body:
{
  "email": "lufrurefrowa-6424@yopmail.com",
  "password": "Admin@1234"
}
```

**Expected Response:**
```json
{
  "message": "Login successful",
  "token": "eyJhbGc...",
  "admin": {
    "id": "...",
    "firstName": "SUPER",
    "lastName": "ADMIN",
    "email": "lufrurefrowa-6424@yopmail.com",
    "role": "admin"  ← MUST BE "admin"
  }
}
```

**Action:** Copy the token!

---

### TEST 2: Generate Onboarding Link (With Admin Token)

**Request:**
```
POST https://offer-documentation.onrender.com/api/onboarding-link/generate

Headers:
Authorization: Bearer [PASTE ADMIN TOKEN HERE]

Body:
{
  "email": "lulloipattissei-9881@yopmail.com",
  "firstName": "shireesha",
  "lastName": "kalwala"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Onboarding link generated successfully",
  "token": "abc123...",
  "url": "http://localhost:3000/onboarding/abc123...",
  "email": "lulloipattissei-9881@yopmail.com",
  "firstName": "shireesha",
  "lastName": "kalwala",
  "draftId": "DRAFT-..."
}
```

---

### TEST 3: Verify Error Handling

**Test 3a: Without Token**
```
POST https://offer-documentation.onrender.com/api/onboarding-link/generate

(No Authorization header)

Body:
{
  "email": "test@example.com",
  "firstName": "Test",
  "lastName": "User"
}
```

**Expected:** `401 Unauthorized - Token missing`

---

**Test 3b: With Employee Token**
```
POST https://offer-documentation.onrender.com/api/onboarding-link/generate

Authorization: Bearer [EMPLOYEE TOKEN]

Body:
{
  "email": "test@example.com",
  "firstName": "Test",
  "lastName": "User"
}
```

**Expected:** `403 Forbidden - Access denied: Admin only`

---

**Test 3c: Missing firstName**
```
POST https://offer-documentation.onrender.com/api/onboarding-link/generate

Authorization: Bearer [ADMIN TOKEN]

Body:
{
  "email": "test@example.com",
  "lastName": "User"
}
```

**Expected:** `400 Bad Request - First name and last name are required`

---

**Test 3d: Missing lastName**
```
POST https://offer-documentation.onrender.com/api/onboarding-link/generate

Authorization: Bearer [ADMIN TOKEN]

Body:
{
  "email": "test@example.com",
  "firstName": "Test"
}
```

**Expected:** `400 Bad Request - First name and last name are required`

---

## 📋 Checklist

Before you test:

- [ ] Server is running
- [ ] MongoDB is connected
- [ ] Admin seeder has created the admin account
- [ ] You're using the correct admin email: `lufrurefrowa-6424@yopmail.com`
- [ ] You're using the correct password: `Admin@1234`

During testing:

- [ ] Login returns a token with `"role": "admin"`
- [ ] You copied the admin token
- [ ] You pasted the token in Authorization → Bearer Token
- [ ] Your request body has firstName and lastName (not candidateName)

---

## 🎯 If It Still Doesn't Work

If you still get 403 error after the middleware fix:

1. **Restart the server** - The middleware changes need a server restart
2. **Clear any cached tokens** - Use a fresh admin login
3. **Check the token in jwt.io** - Paste your token and verify it has `"role": "admin"`
4. **Share the exact error** - Copy the full error response

---

## 💡 Quick Debug

Decode your token at https://jwt.io and check:

```json
{
  "id": "...",
  "role": "admin",  ← MUST be "admin", not "employee"
  "iat": ...,
  "exp": ...
}
```

If role is "employee", you're using the wrong login!

---

**The middleware is now fixed. Try the test and let me know the result!**
