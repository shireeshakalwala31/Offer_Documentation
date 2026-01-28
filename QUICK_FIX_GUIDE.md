# QUICK FIX - Step by Step Guide

## ⚠️ YOU MUST DO THESE 2 STEPS IN ORDER

### STEP 1: LOGIN TO GET TOKEN (Do this FIRST!)

**In Postman:**

1. Create a **NEW** request
2. Set method to **POST**
3. URL: `https://offer-documentation.onrender.com/api/offer/login`
4. Go to **Body** tab
5. Select **raw** and **JSON**
6. Paste this:
```json
{
  "email": "lufrurefrowa-6424@yopmail.com",
  "password": "Admin@1234"
}
```
7. Click **Send**
8. **COPY THE TOKEN** from the response (it will look like: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)

---

### STEP 2: USE THE TOKEN TO GENERATE LINK

**In Postman:**

1. Create a **NEW** request (or use your existing one)
2. Set method to **POST**
3. URL: `https://offer-documentation.onrender.com/api/onboarding-link/generate`
4. Go to **Authorization** tab
5. Type: Select **Bearer Token**
6. Token: **PASTE THE TOKEN YOU COPIED FROM STEP 1**
7. Go to **Body** tab
8. Select **raw** and **JSON**
9. Paste this:
```json
{
  "email": "lulloipattissei-9881@yopmail.com",
  "firstName": "shireesha",
  "lastName": "kalwala"
}
```
10. Click **Send**

---

## ✅ SUCCESS!

You should now get a response like:
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

## 🚨 COMMON MISTAKES

### Mistake 1: Not logging in first
❌ **Wrong:** Calling generate endpoint without token
✅ **Right:** Login first, get token, then use it

### Mistake 2: Not adding the token
❌ **Wrong:** Calling generate endpoint without Authorization header
✅ **Right:** Add token in Authorization tab as Bearer Token

### Mistake 3: Wrong token format
❌ **Wrong:** Just pasting the token in headers manually
✅ **Right:** Use Authorization tab → Bearer Token → Paste token

---

## 📸 VISUAL GUIDE

### STEP 1 - Login Request:
```
Method: POST
URL: https://offer-documentation.onrender.com/api/offer/login

Headers:
Content-Type: application/json

Body (raw JSON):
{
  "email": "lufrurefrowa-6424@yopmail.com",
  "password": "Admin@1234"
}

Response will contain:
{
  "token": "eyJhbGc..." ← COPY THIS!
}
```

### STEP 2 - Generate Link Request:
```
Method: POST
URL: https://offer-documentation.onrender.com/api/onboarding-link/generate

Authorization Tab:
Type: Bearer Token
Token: [PASTE TOKEN HERE]

Body (raw JSON):
{
  "email": "lulloipattissei-9881@yopmail.com",
  "firstName": "shireesha",
  "lastName": "kalwala"
}
```

---

## ❓ STILL GETTING ERROR?

### Error: "Access denied: Admin only"
**Cause:** You didn't add the token or token is wrong
**Fix:** 
1. Make sure you logged in and got a token
2. Make sure you added the token in Authorization tab
3. Make sure you selected "Bearer Token" type

### Error: "Token missing"
**Cause:** Token not in Authorization header
**Fix:** Go to Authorization tab → Select "Bearer Token" → Paste token

### Error: "Invalid or expired token"
**Cause:** Token expired (24 hours) or wrong token
**Fix:** Login again to get a new token

### Error: "First name and last name are required"
**Cause:** You're using old request format with "candidateName"
**Fix:** Use new format with "firstName" and "lastName"

---

## 🎯 CHECKLIST

Before clicking Send on generate link request:

- [ ] I logged in and got a token
- [ ] I copied the token from login response
- [ ] I went to Authorization tab
- [ ] I selected "Bearer Token" type
- [ ] I pasted the token
- [ ] My body has "firstName" and "lastName" (not "candidateName")
- [ ] I'm using the correct URL

---

## 💡 PRO TIP

Save the login request in Postman and add this to the **Tests** tab:
```javascript
var jsonData = pm.response.json();
pm.environment.set("admin_token", jsonData.token);
```

Then in generate link request, use `{{admin_token}}` in the Bearer Token field.
This way the token is automatically saved and used!

---

**Need more help?** Check `POSTMAN_AUTHENTICATION_GUIDE.md` for detailed instructions.
