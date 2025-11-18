# Passkey Setup Guide

This guide explains how to use and manage passkey authentication in your Ory application.

## Overview

Passkeys (WebAuthn) have been configured for your application. The configuration differs between **local development** and **production** environments due to browser security requirements.

## Quick Start

### Switch Between Environments

Use the helper script to toggle between development and production configurations:

```bash
# From the ory-test directory
./scripts/toggle-passkey-env.sh
```

The script will:
- ✅ Show your current configuration
- ✅ Prompt for confirmation before switching
- ✅ Update the Ory project configuration
- ✅ Display the new settings

### Manual Configuration

If you prefer to configure manually using the Ory CLI:

**For Local Development (localhost:3000):**
```bash
ory patch identity-config --project e3705db5-5626-4ab2-9590-9329be6d014a \
  --replace '/selfservice/methods/passkey/config/rp/id="localhost"' \
  --replace '/selfservice/methods/passkey/config/rp/origins=["http://localhost:3000"]'
```

**For Production:**
```bash
ory patch identity-config --project e3705db5-5626-4ab2-9590-9329be6d014a \
  --replace '/selfservice/methods/passkey/config/rp/id="crazy-chatelet-dfzw3l7h98.projects.oryapis.com"' \
  --replace '/selfservice/methods/passkey/config/rp/origins=["https://crazy-chatelet-dfzw3l7h98.projects.oryapis.com"]'
```

## Testing Passkeys Locally

1. **Set to development mode:**
   ```bash
   ./scripts/toggle-passkey-env.sh
   ```

2. **Start your dev server:**
   ```bash
   npm run dev
   ```

3. **Test Registration:**
   - Navigate to http://localhost:3000/auth/registration
   - Click "Sign up with a passkey"
   - Follow the browser prompt to create a passkey (Face ID, Touch ID, or security key)

4. **Test Login:**
   - Navigate to http://localhost:3000/auth/login
   - Click "Sign in with a passkey"
   - Or use the username field with autofill to select your passkey

5. **Test Settings:**
   - Navigate to http://localhost:3000/settings
   - Add or remove passkeys from your account

## Important Notes

### Browser Support
Passkeys work in modern browsers:
- ✅ Chrome/Edge 108+
- ✅ Safari 16+
- ✅ Firefox 119+

### Security Considerations

1. **Relying Party ID (RP ID)**: This must match the domain where passkeys are used
   - Development: `localhost`
   - Production: `crazy-chatelet-dfzw3l7h98.projects.oryapis.com`

2. **Origins**: Must be the exact URL (including protocol and port)
   - Development: `http://localhost:3000`
   - Production: `https://crazy-chatelet-dfzw3l7h98.projects.oryapis.com`

3. **Passkeys are Environment-Specific**: Passkeys registered in development won't work in production and vice versa, because they're bound to different RP IDs.

### Before Deploying to Production

⚠️ **Always switch back to production configuration before deploying:**

```bash
./scripts/toggle-passkey-env.sh
```

Verify the configuration shows:
- RP ID: `crazy-chatelet-dfzw3l7h98.projects.oryapis.com`
- Origin: `https://crazy-chatelet-dfzw3l7h98.projects.oryapis.com`

## Verification

Check your current passkey configuration:

```bash
ory get identity-config --project e3705db5-5626-4ab2-9590-9329be6d014a --format json | jq '.selfservice.methods.passkey'
```

Expected output:
```json
{
  "config": {
    "rp": {
      "display_name": "sanjay.party",
      "id": "localhost",  // or your production domain
      "origins": [
        "http://localhost:3000"  // or your production URL
      ]
    }
  },
  "enabled": true
}
```

## Troubleshooting

### "SecurityError" when registering passkey
- ✅ Ensure RP ID matches your current domain
- ✅ Verify origin is in the allowed origins list
- ✅ Check that you're using HTTPS in production (localhost can use HTTP)

### Passkey option not appearing in UI
- ✅ Check that passkeys are enabled: `enabled: true`
- ✅ Verify your browser supports passkeys
- ✅ Clear browser cache and restart dev server

### Passkey works locally but not in production
- ✅ Run the toggle script to switch to production config
- ✅ Verify the RP ID matches your production domain
- ✅ Register a new passkey in production (dev passkeys won't work)

## Additional Resources

- [Ory Passkey Documentation](https://www.ory.com/docs/kratos/passwordless/passkeys)
- [WebAuthn Guide](https://webauthn.guide/)
- [Passkeys.dev](https://passkeys.dev/)

## Project Information

- **Project ID**: `e3705db5-5626-4ab2-9590-9329be6d014a`
- **Project Slug**: `crazy-chatelet-dfzw3l7h98`
- **Production URL**: `https://crazy-chatelet-dfzw3l7h98.projects.oryapis.com`
- **Display Name**: `sanjay.party`
