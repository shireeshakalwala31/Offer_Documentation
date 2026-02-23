# Fix Implementation Plan

## Task: Fix API Errors - Token Verification & Relieving Letter PDF Generation

### Issues to Fix:
1. `/api/offer/verify-token` returning 400 (route doesn't exist)
2. Token verification failing with generic AxiosError
3. Relieving letter creation returning 500 (PDF generation failure)

### Implementation Steps:

- [ ] **Step 1**: Add `/verify-token` endpoint to `routes/offerRoutes.js`
- [ ] **Step 2**: Create verifyToken controller function in `controllers/offerController.js`
- [ ] **Step 3**: Improve error handling in `middleware/authMiddleware.js`
- [ ] **Step 4**: Auto-generate PDF after relieving letter creation in `controllers/relievingController.js`

---

## Progress Log:

### Step 1: Adding verify-token route
**File:** routes/offerRoutes.js
**Status:** Pending
**Changes:**
- Add new POST route `/verify-token` 
- No auth required (public endpoint for frontend token validation)

### Step 2: Creating verifyToken controller  
**File:** controllers/offerController.js
**Status:** Pending  
**Changes:**
- Export new function to validate JWT tokens without requiring admin privileges

### Step 3: Improving Auth Middleware Error Handling
**File:** middleware/authMiddleware.js  
**Status:** Pending
**Changes:**
- Return more descriptive error messages for different failure scenarios:
  - Missing token → "Token missing"
  - Invalid format → "Invalid token format" 
  - Expired → "Token expired"
  - Wrong secret → "Invalid token"

### Step auto-generate PDF Option for Relieving Letters**
This is an optional enhancement where we can add auto-generation of PDFs when creating relieving letters, rather than requiring separate API calls.

---
