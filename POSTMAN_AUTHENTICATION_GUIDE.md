# Postman Authentication Guide - Onboarding Link Generation

## Problem
Getting "403 Forbidden - Access denied: Admin only" error when calling `/api/onboarding-link/generate`

## Solution
You need to login first and use the admin token in your requests.

---

## Step 1: Login as Admin

### Request Details:
- **Method**: POST
- **URL**: `https://offer-documentation.onrender.com/api/offer/login`
- **Headers**: 
  ```
  Content-Type: application/json
  ```
- **Body** (raw JSON):
  ```json
  {
    "email": "lufrurefrowa-6424@yopmail.com",
    "password": "Admin@1234"
  }
  ```

### Expected Response:
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY3OGE4ZjNiNGUyZjNhMDAxMjM0NTY3OCIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTczNzk4NzY1NCwiZXhwIjoxNzM4MDc0MDU0fQ.abc123xyz...",
  "admin": {
    "id": "678a8f3b4e2f3a0012345678",
    "firstName": "SUPER",
    "lastName": "ADMIN",
    "email": "lufrurefrowa-6424@yopmail.com",
    "role": "admin"
  }
}
```

**IMPORTANT**: Copy the `token` value from the response!

---

## Step 2: Generate Onboarding Link (With Token)

### Request Details:
- **Method**: POST
- **URL**: `https://offer-documentation.onrender.com/api/onboarding-link/generate`
- **Headers**: 
  ```
  Content-Type: application/json
  Authorization: Bearer YOUR_TOKEN_HERE
  ```
  
  **Replace `YOUR_TOKEN_HERE` with the actual token from Step 1**

- **Body** (raw JSON):
  ```json
  {
    "email": "lulloipattissei-9881@yopmail.com",
    "firstName": "shireesha",
    "lastName": "kalwala"
  }
  ```

### Expected Success Response:
```json
{
  "success": true,
  "message": "Onboarding link generated successfully",
  "token": "a1b2c3d4e5f6...",
  "url": "http://localhost:3000/onboarding/a1b2c3d4e5f6...",
  "email": "lulloipattissei-9881@yopmail.com",
  "draftId": "DRAFT-1737987654321-a1b2c3d4"
}
```

---

## Postman Setup Instructions

### Method 1: Using Authorization Tab (Recommended)

1. **Login Request**:
   - Create a new POST request
   - URL: `https://offer-documentation.onrender.com/api/offer/login`
   - Body → raw → JSON
   - Paste login credentials
   - Click **Send**
   - **Copy the token from response**

2. **Generate Link Request**:
   - Create a new POST request
   - URL: `https://offer-documentation.onrender.com/api/onboarding-link/generate`
   - Go to **Authorization** tab
   - Type: Select **Bearer Token**
   - Token: Paste the token you copied
   - Go to **Body** tab → raw → JSON
   - Paste the request body
   - Click **Send**

### Method 2: Using Headers Tab

1. Same login step as above
2. For Generate Link Request:
   - Go to **Headers** tab
   - Add new header:
     - Key: `Authorization`
     - Value: `Bearer YOUR_TOKEN_HERE` (paste actual token)
   - Go to **Body** tab and add request body
   - Click **Send**

---

## Postman Collection Example

```json
{
  "info": {
    "name": "Onboarding Link API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "1. Admin Login",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"email\": \"lufrurefrowa-6424@yopmail.com\",\n  \"password\": \"Admin@1234\"\n}"
        },
        "url": {
          "raw": "https://offer-documentation.onrender.com/api/offer/login",
          "protocol": "https",
          "host": ["offer-documentation", "onrender", "com"],
          "path": ["api", "offer", "login"]
        }
      }
    },
    {
      "name": "2. Generate Onboarding Link",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          },
          {
            "key": "Authorization",
            "value": "Bearer {{admin_token}}"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"email\": \"lulloipattissei-9881@yopmail.com\",\n  \"firstName\": \"shireesha\",\n  \"lastName\": \"kalwala\"\n}"
        },
        "url": {
          "raw": "https://offer-documentation.onrender.com/api/onboarding-link/generate",
          "protocol": "https",
          "host": ["offer-documentation", "onrender", "com"],
          "path": ["api", "onboarding-link", "generate"]
        }
      }
    }
  ]
}
```

---

## Using Postman Variables (Advanced)

To automatically use the token from login:

1. **In Login Request**:
   - Go to **Tests** tab
   - Add this script:
   ```javascript
   var jsonData = pm.response.json();
   pm.environment.set("admin_token", jsonData.token);
   ```

2. **In Generate Link Request**:
   - Authorization → Bearer Token
   - Token: `{{admin_token}}`

Now when you login, the token is automatically saved and used!

---

## Troubleshooting

### Error: "Token missing"
- Make sure you added the Authorization header
- Format should be: `Bearer YOUR_TOKEN_HERE` (with space after Bearer)

### Error: "Invalid or expired token"
- Token expires in 1 day
- Login again to get a new token

### Error: "Access denied: Admin only"
- You're not using the token
- Double-check the Authorization header is set correctly

### Error: "Admin not found"
- Check if admin seeder ran successfully
- Verify email: `lufrurefrowa-6424@yopmail.com`
- Verify password: `Admin@1234`

---

## Quick Test Commands (cURL)

### Login:
```bash
curl -X POST https://offer-documentation.onrender.com/api/offer/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "lufrurefrowa-6424@yopmail.com",
    "password": "Admin@1234"
  }'
```

### Generate Link (replace TOKEN):
```bash
curl -X POST https://offer-documentation.onrender.com/api/onboarding-link/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "email": "lulloipattissei-9881@yopmail.com",
    "firstName": "shireesha",
    "lastName": "kalwala"
  }'
```

---

## Summary

1. ✅ Login with admin credentials
2. ✅ Copy the token from response
3. ✅ Add token to Authorization header as `Bearer TOKEN`
4. ✅ Call generate endpoint
5. ✅ Success! You'll get the onboarding link

**Token expires in 24 hours** - login again if expired.
