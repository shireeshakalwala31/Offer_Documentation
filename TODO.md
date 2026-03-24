# Onboarding Login Prod Fix - TODO

## Plan Status
- [ ] 1. Update controllers/onboardingLinkController.js (pass backendApiUrl to template)
- [ ] 2. Update templates/onboarding-login.ejs (use dynamic API URL in fetch)
- [ ] 3. Test locally
- [ ] 4. Deploy to Render with env vars
- [x] Plan approved by user

**Root cause:** Prod frontend (offer-documentation-frontend.onrender.com) vs backend (offer-documentation.onrender.com). Relative fetch('/api/...') hits frontend server.

**Required Render env vars:**
```
BACKEND_API_URL=https://offer-documentation.onrender.com
PUBLIC_WEB_URL=https://offer-documentation-frontend.onrender.com
