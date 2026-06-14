# BusBook Setup Guide

This guide covers the required setup for email OTP, SMS OTP, and social logins to work properly.

## Prerequisites

1. Firebase Project
2. Netlify account (for hosting functions)
3. SMTP email service (e.g., SendGrid, Mailgun, Gmail)

## Firebase Console Setup

### 1. Enable Authentication Methods

Go to Firebase Console → Authentication → Sign-in method:

**Required for Social Logins:**
- Enable **Google** sign-in
  - Add your authorized domains (localhost for development, your production domain)
- Enable **Facebook** sign-in (optional)
  - Add your Facebook App ID and App Secret
  - Add your authorized domains

**Required for Phone OTP:**
- Enable **Phone** sign-in
  - This is required for SMS OTP functionality
  - Note: Firebase Phone Auth requires reCAPTCHA verification

### 2. Create Service Account for Server-Side Operations

Go to Firebase Console → Project Settings → Service Accounts:

1. Click "Generate New Private Key"
2. Download the JSON file
3. Copy the contents to your environment variables (see below)

### 3. Configure Firestore Database

Go to Firebase Console → Firestore Database:

1. Create a database (if not exists)
2. Set up security rules (copy from `firestore.rules`)
3. Create required indexes (copy from `firestore.indexes.json`)

## Environment Variables Setup

### Required Variables

Add these to your `.env` file:

```bash
# Firebase Client SDK (for frontend)
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Firebase Admin SDK (for Netlify functions)
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=your_service_account_email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour_private_key_content\n-----END PRIVATE KEY-----\n"
```

### Email OTP Setup

```bash
# SMTP Configuration
SMTP_HOST=smtp.gmail.com  # or your SMTP server
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password  # Use App Password for Gmail
SMTP_FROM_EMAIL=your_email@gmail.com
SMTP_SECURE=false

# Email OTP Configuration
EMAIL_OTP_SECRET=your_random_secret_key_at_least_32_chars
EMAIL_OTP_EXPIRES_MINUTES=10

# Development Mode (set to true for local testing without email)
OTP_DEV_MODE=false
```

**Gmail SMTP Setup:**
1. Enable 2-Factor Authentication
2. Go to Google Account → Security → App Passwords
3. Generate a new App Password
4. Use the App Password in `SMTP_PASS`

### reCAPTCHA Setup (Optional but Recommended)

```bash
# reCAPTCHA Configuration
RECAPTCHA_SECRET_KEY=your_recaptcha_secret_key_v2_or_v3
RECAPTCHA_MIN_SCORE=0.5
REQUIRE_RECAPTCHA=false  # Set to true to enforce reCAPTCHA
```

**To get reCAPTCHA keys:**
1. Go to Google reCAPTCHA admin console
2. Register your site
3. Get Site Key (for frontend) and Secret Key (for backend)
4. Add Site Key to your Firebase project settings

## Social Login Setup

### Google Login

1. Go to Firebase Console → Authentication → Sign-in method
2. Enable Google sign-in
3. Add your authorized domains:
   - `localhost` for development
   - `your-production-domain.com` for production

### Facebook Login (Optional)

1. Create a Facebook App at [Facebook Developer Portal](https://developers.facebook.com/)
2. Add Facebook Login product
3. Copy App ID and App Secret
4. Go to Firebase Console → Authentication → Sign-in method
5. Enable Facebook sign-in
6. Paste App ID and App Secret
7. Add your authorized domains

## Phone OTP (SMS) Setup

Phone OTP uses Firebase Phone Auth. No additional setup beyond enabling Phone sign-in in Firebase Console.

**Important:** Firebase Phone Auth requires:
1. Phone sign-in enabled in Firebase Console
2. reCAPTCHA verification (automatically handled by Firebase)
3. Valid phone numbers in E.164 format (e.g., +250788123456 for Rwanda)

## Netlify Functions Deployment

1. Ensure all environment variables are set in Netlify dashboard
2. Deploy the functions: `netlify deploy --prod`
3. Test each function individually using the health check: `https://your-site.netlify.app/.netlify/functions/health-check`

## Troubleshooting

### Email OTP "Unknown Error"

If you get an "unknown error" after email OTP says "sent":

1. Check Netlify function logs for detailed error messages
2. Verify SMTP credentials are correct
3. Test SMTP connection manually
4. Check if `EMAIL_OTP_SECRET` is set
5. Verify Firebase service account credentials
6. Set `OTP_DEV_MODE=true` for local testing (logs OTP to console)

### Phone OTP Issues

1. Verify Phone Auth is enabled in Firebase Console
2. Check reCAPTCHA is working (Firebase requirement)
3. Ensure phone numbers are in E.164 format
4. Check Firebase quotas for SMS verification

### Social Login Issues

1. Verify OAuth domains are configured in Firebase Console
2. Check that redirect URIs match your application URLs
3. Ensure Firebase SDK is properly initialized
4. Check browser console for OAuth errors

### Health Check Failures

Visit `/status` page to see detailed system health:
- Database connectivity
- Email service configuration
- OTP system status
- Firebase Auth status

## Testing

### Local Development

1. Set `OTP_DEV_MODE=true` in `.env`
2. Email OTPs will be logged to console instead of sent
3. Test all authentication flows

### Production Testing

1. Deploy to staging first
2. Test with real email/phone numbers
3. Monitor Netlify function logs
4. Use status page to monitor system health

## Security Best Practices

1. Never commit `.env` file to version control
2. Use different Firebase projects for development and production
3. Rotate `EMAIL_OTP_SECRET` periodically
4. Enable reCAPTCHA in production
5. Monitor Firebase usage quotas
6. Set up rate limiting on all endpoints
7. Use Firebase Security Rules to protect data
8. Enable Firebase App Check if using paid services

## Support

For issues with:
- **Firebase**: Check Firebase Console and documentation
- **Netlify**: Check Netlify dashboard logs
- **SMTP**: Contact your email service provider
- **reCAPTCHA**: Check Google reCAPTCHA admin console

Check the `/status` page for real-time system health information.