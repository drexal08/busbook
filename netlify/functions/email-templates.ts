export interface EmailTemplateParams {
  code: string;
  expiresInMinutes: number;
}

export function generateEmailOtpTemplate(params: EmailTemplateParams): {
  subject: string;
  text: string;
  html: string;
} {
  const { code, expiresInMinutes } = params;

  return {
    subject: 'Your BusBook verification code',
    text: `Your BusBook verification code is ${code}. It expires in ${expiresInMinutes} minutes.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #111827;">
        <h2 style="margin: 0 0 12px;">BusBook verification code</h2>
        <p style="margin: 0 0 16px; color: #4b5563;">Use this code to verify your email address.</p>
        <div style="font-size: 32px; font-weight: 700; letter-spacing: 8px; background: #f3f4f6; border-radius: 12px; padding: 18px; text-align: center;">
          ${code}
        </div>
        <p style="margin: 16px 0 0; color: #6b7280;">This code expires in ${expiresInMinutes} minutes.</p>
        <p style="margin: 24px 0 0; color: #9ca3af; font-size: 12px;">If you didn't request this code, please ignore this email.</p>
      </div>
    `,
  };
}

export function generatePasswordResetTemplate(params: { resetLink: string }): {
  subject: string;
  text: string;
  html: string;
} {
  const { resetLink } = params;

  return {
    subject: 'Reset your BusBook password',
    text: `Click the following link to reset your BusBook password: ${resetLink}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #111827;">
        <h2 style="margin: 0 0 12px;">Reset your BusBook password</h2>
        <p style="margin: 0 0 16px; color: #4b5563;">Click the button below to reset your password.</p>
        <div style="text-align: center; margin: 24px 0;">
          <a href="${resetLink}" style="display: inline-block; background: #4066e3; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
            Reset Password
          </a>
        </div>
        <p style="margin: 24px 0 0; color: #9ca3af; font-size: 12px;">If you didn't request a password reset, please ignore this email.</p>
      </div>
    `,
  };
}
