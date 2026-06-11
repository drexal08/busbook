#!/usr/bin/env node

/**
 * Environment Variable Validation Script
 * Validates that all required environment variables are set and properly formatted
 */

const requiredEnvVars = {
  // Firebase Configuration
  'FIREBASE_PROJECT_ID': { required: true, description: 'Firebase Project ID' },
  'FIREBASE_CLIENT_EMAIL': { required: true, description: 'Firebase Service Account Client Email' },
  'FIREBASE_PRIVATE_KEY': { required: true, description: 'Firebase Service Account Private Key' },
  
  // SMTP Configuration (optional when OTP_DEV_MODE=true)
  'SMTP_HOST': { required: false, description: 'SMTP server hostname' },
  'SMTP_PORT': { required: false, default: '587', description: 'SMTP server port (usually 587 or 465)' },
  'SMTP_USER': { required: false, description: 'SMTP username' },
  'SMTP_PASS': { required: false, description: 'SMTP password' },
  'SMTP_FROM_EMAIL': { required: false, description: 'From email address for OTP emails' },
  'OTP_DEV_MODE': { required: false, default: 'false', description: 'Log OTP to console instead of sending email (dev only)' },
  'SMTP_SECURE': { required: false, default: 'false', description: 'Use secure connection (true/false)' },
  
  // OTP Configuration
  'EMAIL_OTP_SECRET': { required: true, description: 'Secret key for OTP hashing' },
  'EMAIL_OTP_EXPIRES_MINUTES': { required: false, default: '10', description: 'OTP expiration time in minutes' },
  'OTP_LENGTH': { required: false, default: '6', description: 'Length of OTP code' },
  'MAX_OTP_REQUESTS': { required: false, default: '5', description: 'Max OTP requests per time window' },
  'OTP_RATE_LIMIT_MINUTES': { required: false, default: '15', description: 'Rate limit time window in minutes' },
  'MAX_OTP_ATTEMPTS': { required: false, default: '3', description: 'Max verification attempts' },
  
  // Payment Configuration
  'PAYMENT_TEST_MODE': { required: false, default: 'true', description: 'Payment test mode (true/false)' },
  'PAYPACK_CLIENT_ID': { required: false, description: 'PayPack Client ID' },
  'PAYPACK_CLIENT_SECRET': { required: false, description: 'PayPack Client Secret' },
};

function stripWrappingQuotes(value: string): string {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }
  return value;
}

function validateEnvVar(name: string, config: any): { valid: boolean; error?: string } {
  const value = process.env[name];
  
  if (config.required && (!value || !stripWrappingQuotes(value))) {
    return { valid: false, error: `Missing required environment variable: ${name}` };
  }
  
  if (!value && config.default) {
    process.env[name] = config.default;
    console.log(`✓ Set default for ${name}: ${config.default}`);
    return { valid: true };
  }
  
  // Type validation for numeric values
  if (name.includes('PORT') || name.includes('MINUTES') || name.includes('LENGTH') || name.includes('MAX') || name.includes('ATTEMPTS')) {
    const numValue = Number(stripWrappingQuotes(value || ''));
    if (isNaN(numValue)) {
      return { valid: false, error: `Invalid numeric value for ${name}: ${value}` };
    }
  }
  
  // Boolean validation
  if (name.includes('SECURE') || name.includes('MODE')) {
    const boolValue = stripWrappingQuotes(value || '').toLowerCase();
    if (!['true', 'false', '1', '0', 'yes', 'no'].includes(boolValue)) {
      return { valid: false, error: `Invalid boolean value for ${name}: ${value}` };
    }
  }
  
  return { valid: true };
}

function isOtpDevMode(): boolean {
  const value = stripWrappingQuotes(process.env.OTP_DEV_MODE || '').toLowerCase();
  return value === 'true' || value === '1' || value === 'yes';
}

function main() {
  console.log('🔍 Validating environment variables...\n');

  if (isOtpDevMode()) {
    console.log('ℹ️  OTP_DEV_MODE is enabled — SMTP credentials are optional for local development\n');
  } else {
    for (const smtpVar of ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS', 'SMTP_FROM_EMAIL']) {
      requiredEnvVars[smtpVar].required = true;
    }
  }
  
  let hasErrors = false;
  let validatedCount = 0;
  
  for (const [name, config] of Object.entries(requiredEnvVars)) {
    const validation = validateEnvVar(name, config);
    
    if (!validation.valid) {
      console.error(`❌ ${validation.error}`);
      console.log(`   Description: ${config.description}`);
      hasErrors = true;
    } else {
      const value = process.env[name];
      const displayValue = name.includes('SECRET') || name.includes('PASS') || name.includes('KEY') 
        ? '***hidden***' 
        : stripWrappingQuotes(value || config.default || '');
      console.log(`✓ ${name}: ${displayValue}`);
      validatedCount++;
    }
  }
  
  console.log(`\n${validatedCount}/${Object.keys(requiredEnvVars).length} variables validated`);
  
  if (hasErrors) {
    console.error('\n❌ Environment validation failed');
    process.exit(1);
  } else {
    console.log('✅ Environment validation passed');
    process.exit(0);
  }
}

main();
