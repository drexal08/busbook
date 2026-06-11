/**
 * Analytics Tracking System
 * 
 * Provides analytics tracking for user actions and verification flows
 * to monitor success rates and identify bottlenecks
 */

export enum AnalyticsEvent {
  // Authentication events
  SIGNUP_STARTED = 'signup_started',
  SIGNUP_COMPLETED = 'signup_completed',
  SIGNUP_FAILED = 'signup_failed',
  LOGIN_COMPLETED = 'login_completed',
  LOGIN_FAILED = 'login_failed',
  LOGOUT = 'logout',

  // Verification events
  EMAIL_OTP_REQUESTED = 'email_otp_requested',
  EMAIL_OTP_SENT = 'email_otp_sent',
  EMAIL_OTP_SEND_FAILED = 'email_otp_send_failed',
  EMAIL_OTP_VERIFIED = 'email_otp_verified',
  EMAIL_OTP_VERIFICATION_FAILED = 'email_otp_verification_failed',
  EMAIL_OTP_EXPIRED = 'email_otp_expired',

  PHONE_OTP_REQUESTED = 'phone_otp_requested',
  PHONE_OTP_SENT = 'phone_otp_sent',
  PHONE_OTP_SEND_FAILED = 'phone_otp_send_failed',
  PHONE_OTP_VERIFIED = 'phone_otp_verified',
  PHONE_OTP_VERIFICATION_FAILED = 'phone_otp_verification_failed',

  VERIFICATION_FLOW_COMPLETED = 'verification_flow_completed',
  VERIFICATION_FLOW_ABANDONED = 'verification_flow_abandoned',

  // User engagement
  PAGE_VIEW = 'page_view',
  BUTTON_CLICK = 'button_click',
  FORM_SUBMIT = 'form_submit',
  ERROR_DISPLAYED = 'error_displayed',
}

interface AnalyticsContext {
  userId?: string;
  sessionId?: string;
  page?: string;
  role?: string;
  [key: string]: any;
}

interface AnalyticsEventPayload {
  event: AnalyticsEvent;
  context?: AnalyticsContext;
  properties?: Record<string, any>;
  timestamp?: string;
}

class Analytics {
  private userId?: string;
  private sessionId?: string;
  private isEnabled = true;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.isEnabled = process.env.NODE_ENV !== 'test';
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  setUserId(userId: string) {
    this.userId = userId;
  }

  setSessionId(sessionId: string) {
    this.sessionId = sessionId;
  }

  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
  }

  private track(payload: AnalyticsEventPayload) {
    if (!this.isEnabled) return;

    const eventPayload: AnalyticsEventPayload = {
      ...payload,
      timestamp: new Date().toISOString(),
      context: {
        userId: this.userId,
        sessionId: this.sessionId,
        ...payload.context,
      },
    };

    // In development, log to console
    if (process.env.NODE_ENV === 'development') {
      console.log('[Analytics]', eventPayload);
    }

    // In production, send to analytics service
    // this.sendToAnalyticsService(eventPayload);
  }

  // Authentication events
  trackSignupStarted(role: string) {
    this.track({
      event: AnalyticsEvent.SIGNUP_STARTED,
      properties: { role },
    });
  }

  trackSignupCompleted(role: string, verificationStatus: string) {
    this.track({
      event: AnalyticsEvent.SIGNUP_COMPLETED,
      properties: { role, verificationStatus },
    });
  }

  trackSignupFailed(role: string, error: string) {
    this.track({
      event: AnalyticsEvent.SIGNUP_FAILED,
      properties: { role, error },
    });
  }

  trackLoginCompleted(method: string) {
    this.track({
      event: AnalyticsEvent.LOGIN_COMPLETED,
      properties: { method },
    });
  }

  trackLoginFailed(method: string, error: string) {
    this.track({
      event: AnalyticsEvent.LOGIN_FAILED,
      properties: { method, error },
    });
  }

  // Email OTP events
  trackEmailOtpRequested(email: string) {
    this.track({
      event: AnalyticsEvent.EMAIL_OTP_REQUESTED,
      properties: { emailDomain: email.split('@')[1] },
    });
  }

  trackEmailOtpSent(email: string, expiresInMinutes: number) {
    this.track({
      event: AnalyticsEvent.EMAIL_OTP_SENT,
      properties: { 
        emailDomain: email.split('@')[1],
        expiresInMinutes,
      },
    });
  }

  trackEmailOtpSendFailed(email: string, error: string) {
    this.track({
      event: AnalyticsEvent.EMAIL_OTP_SEND_FAILED,
      properties: { emailDomain: email.split('@')[1], error },
    });
  }

  trackEmailOtpVerified(email: string, attemptCount: number) {
    this.track({
      event: AnalyticsEvent.EMAIL_OTP_VERIFIED,
      properties: { 
        emailDomain: email.split('@')[1],
        attemptCount,
      },
    });
  }

  trackEmailOtpVerificationFailed(email: string, error: string, attemptCount: number) {
    this.track({
      event: AnalyticsEvent.EMAIL_OTP_VERIFICATION_FAILED,
      properties: { 
        emailDomain: email.split('@')[1],
        error,
        attemptCount,
      },
    });
  }

  // Phone OTP events
  trackPhoneOtpRequested(phone: string) {
    this.track({
      event: AnalyticsEvent.PHONE_OTP_REQUESTED,
      properties: { phonePrefix: phone.substring(0, 6) },
    });
  }

  trackPhoneOtpSent(phone: string) {
    this.track({
      event: AnalyticsEvent.PHONE_OTP_SENT,
      properties: { phonePrefix: phone.substring(0, 6) },
    });
  }

  trackPhoneOtpSendFailed(phone: string, error: string) {
    this.track({
      event: AnalyticsEvent.PHONE_OTP_SEND_FAILED,
      properties: { phonePrefix: phone.substring(0, 6), error },
    });
  }

  trackPhoneOtpVerified(phone: string, attemptCount: number) {
    this.track({
      event: AnalyticsEvent.PHONE_OTP_VERIFIED,
      properties: { 
        phonePrefix: phone.substring(0, 6),
        attemptCount,
      },
    });
  }

  trackPhoneOtpVerificationFailed(phone: string, error: string, attemptCount: number) {
    this.track({
      event: AnalyticsEvent.PHONE_OTP_VERIFICATION_FAILED,
      properties: { 
        phonePrefix: phone.substring(0, 6),
        error,
        attemptCount,
      },
    });
  }

  // General events
  trackPageView(page: string) {
    this.track({
      event: AnalyticsEvent.PAGE_VIEW,
      context: { page },
    });
  }

  trackButtonClick(buttonName: string, page: string) {
    this.track({
      event: AnalyticsEvent.BUTTON_CLICK,
      context: { page },
      properties: { buttonName },
    });
  }

  trackFormSubmit(formName: string, page: string) {
    this.track({
      event: AnalyticsEvent.FORM_SUBMIT,
      context: { page },
      properties: { formName },
    });
  }

  trackErrorDisplayed(error: string, page: string) {
    this.track({
      event: AnalyticsEvent.ERROR_DISPLAYED,
      context: { page },
      properties: { error },
    });
  }
}

// Singleton instance
export const analytics = new Analytics();

/**
 * React hook for using analytics in components
 */
export function useAnalytics() {
  return {
    analytics,
    setUserId: (userId: string) => analytics.setUserId(userId),
  };
}
