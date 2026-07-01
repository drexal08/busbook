import { RECAPTCHA_CONFIG } from './constants';

declare global {
  interface Window {
    grecaptcha?: {
      ready: (callback: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
    };
  }
}

const RECAPTCHA_SCRIPT_ID = 'google-recaptcha-v3';
let recaptchaScriptPromise: Promise<void> | null = null;

function ensureRecaptchaScript(siteKey: string) {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('reCAPTCHA is only available in the browser.'));
  }

  if (window.grecaptcha) {
    return Promise.resolve();
  }

  if (recaptchaScriptPromise) {
    return recaptchaScriptPromise;
  }

  const existingScript = document.getElementById(RECAPTCHA_SCRIPT_ID) as HTMLScriptElement | null;
  if (existingScript) {
    recaptchaScriptPromise = new Promise<void>((resolve, reject) => {
      existingScript.addEventListener('load', () => resolve(), { once: true });
      existingScript.addEventListener('error', () => reject(new Error('Failed to load reCAPTCHA.')), { once: true });
    });
    return recaptchaScriptPromise;
  }

  recaptchaScriptPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.id = RECAPTCHA_SCRIPT_ID;
    script.src = `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(siteKey)}`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load reCAPTCHA.'));
    document.head.appendChild(script);
  });
  return recaptchaScriptPromise;
}

export async function getRecaptchaToken(action: string) {
  const siteKey = RECAPTCHA_CONFIG.SITE_KEY.trim();
  if (!siteKey) {
    return '';
  }

  await ensureRecaptchaScript(siteKey);

  return new Promise<string>((resolve, reject) => {
    const grecaptcha = window.grecaptcha;
    if (!grecaptcha) {
      reject(new Error('reCAPTCHA is not available.'));
      return;
    }

    grecaptcha.ready(() => {
      grecaptcha
        .execute(siteKey, { action })
        .then(resolve)
        .catch(() => reject(new Error('Failed to verify reCAPTCHA. Please try again.')));
    });
  });
}
