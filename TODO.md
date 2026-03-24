# Onboarding Login 404 Fix - TODO

## Current Status
✅ Plan approved by user  
🔄 **Step 1: Create login template** (in progress)

## Steps to Complete

### 1. Create Template ✅ COMPLETE
- [x] `templates/onboarding-login.ejs`
  - Standalone HTML login form
  - POST to `/api/onboarding-link/login`
  - Handle invalid/expired/valid token states

### 2. Update Controller ✅ COMPLETE
- [x] `controllers/onboardingLinkController.js`
  - Modified `validateOnboardingToken`
  - Renders EJS instead of JSON
  - Passes status data to template

### 2. Update Controller
- [ ] `controllers/onboardingLinkController.js`
  - Modify `validateOnboardingToken`
  - Render EJS instead of JSON
  - Pass status data to template

### 3. Testing [NEXT]
- [ ] Generate new onboarding link  
- [ ] Visit `/onboarding/:token/login` → see HTML login page
- [ ] Test login form submission
- [ ] Verify Render deployment

### 4. Deploy & Verify
- [ ] Push to Render
- [ ] Test production URL

**Status:** Code changes complete! Ready for testing.
**Next Action:** Test locally

### 4. Deploy & Verify
- [ ] Push to Render
- [ ] Test production URL

**Next Action:** Creating `templates/onboarding-login.ejs`
