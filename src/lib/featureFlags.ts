/**
 * Feature Flags System
 * 
 * Feature flags allow you to toggle functionality on/off without deploying code changes.
 * They can be controlled via environment variables or Firestore configuration.
 */

export enum FeatureFlag {
  // Authentication features
  EMAIL_OTP_VERIFICATION = 'EMAIL_OTP_VERIFICATION',
  PHONE_OTP_VERIFICATION = 'PHONE_OTP_VERIFICATION',
  SOCIAL_AUTH_GOOGLE = 'SOCIAL_AUTH_GOOGLE',
  SOCIAL_AUTH_FACEBOOK = 'SOCIAL_AUTH_FACEBOOK',
  
  // User roles
  OPERATOR_REGISTRATION = 'OPERATOR_REGISTRATION',
  COMPANY_REGISTRATION = 'COMPANY_REGISTRATION',
  
  // Advanced features
  SEAT_SELECTION = 'SEAT_SELECTION',
  ONLINE_PAYMENT = 'ONLINE_PAYMENT',
  QR_TICKETING = 'QR_TICKETING',
  
  // Testing features
  DEMO_MODE = 'DEMO_MODE',
  SKIP_VERIFICATION = 'SKIP_VERIFICATION',
}

interface FeatureFlagConfig {
  enabled: boolean;
  description: string;
  rolloutPercentage?: number; // For gradual rollouts (0-100)
}

// Default feature flag configuration
const DEFAULT_FLAGS: Record<FeatureFlag, FeatureFlagConfig> = {
  [FeatureFlag.EMAIL_OTP_VERIFICATION]: { enabled: true, description: 'Enable email OTP verification' },
  [FeatureFlag.PHONE_OTP_VERIFICATION]: { enabled: true, description: 'Enable phone OTP verification' },
  [FeatureFlag.SOCIAL_AUTH_GOOGLE]: { enabled: true, description: 'Enable Google social authentication' },
  [FeatureFlag.SOCIAL_AUTH_FACEBOOK]: { enabled: true, description: 'Enable Facebook social authentication' },
  [FeatureFlag.OPERATOR_REGISTRATION]: { enabled: true, description: 'Enable operator registration' },
  [FeatureFlag.COMPANY_REGISTRATION]: { enabled: true, description: 'Enable company registration' },
  [FeatureFlag.SEAT_SELECTION]: { enabled: true, description: 'Enable seat selection feature' },
  [FeatureFlag.ONLINE_PAYMENT]: { enabled: true, description: 'Enable online payment processing' },
  [FeatureFlag.QR_TICKETING]: { enabled: true, description: 'Enable QR code ticketing' },
  [FeatureFlag.DEMO_MODE]: { enabled: false, description: 'Enable demo mode with sample data' },
  [FeatureFlag.SKIP_VERIFICATION]: { enabled: false, description: 'Skip verification steps (development only)' },
};

class FeatureFlagManager {
  private flags: Map<FeatureFlag, FeatureFlagConfig> = new Map();
  private userId?: string;

  constructor() {
    // Initialize with defaults
    Object.entries(DEFAULT_FLAGS).forEach(([key, config]) => {
      this.flags.set(key as FeatureFlag, config);
    });
    
    // Override with environment variables
    this.loadFromEnvironment();
  }

  private loadFromEnvironment() {
    Object.values(FeatureFlag).forEach((flag) => {
      const envValue = process.env[`FEATURE_${flag}`];
      if (envValue !== undefined) {
        const enabled = envValue === 'true' || envValue === '1';
        const current = this.flags.get(flag) || { enabled: false, description: '' };
        this.flags.set(flag, { ...current, enabled });
      }
    });
  }

  /**
   * Set a user ID for user-specific feature flag evaluations
   */
  setUserId(userId: string) {
    this.userId = userId;
  }

  /**
   * Check if a feature flag is enabled
   */
  isEnabled(flag: FeatureFlag): boolean {
    const config = this.flags.get(flag);
    if (!config) {
      console.warn(`Unknown feature flag: ${flag}`);
      return false;
    }

    // If rollout percentage is set, use it for gradual rollout
    if (config.rolloutPercentage !== undefined && this.userId) {
      const hash = this.hashUserId(this.userId);
      return (hash % 100) < config.rolloutPercentage;
    }

    return config.enabled;
  }

  /**
   * Enable or disable a feature flag at runtime
   */
  setEnabled(flag: FeatureFlag, enabled: boolean) {
    const current = this.flags.get(flag);
    if (current) {
      this.flags.set(flag, { ...current, enabled });
    }
  }

  /**
   * Get all feature flags (for debugging/admin)
   */
  getAllFlags(): Record<FeatureFlag, FeatureFlagConfig> {
    return Object.fromEntries(this.flags.entries()) as Record<FeatureFlag, FeatureFlagConfig>;
  }

  /**
   * Simple hash function for consistent user-based rollout
   */
  private hashUserId(userId: string): number {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }
}

// Singleton instance
export const featureFlags = new FeatureFlagManager();

/**
 * Convenience function to check if a feature is enabled
 */
export function isFeatureEnabled(flag: FeatureFlag): boolean {
  return featureFlags.isEnabled(flag);
}

/**
 * React hook for feature flags
 */
export function useFeatureFlag(flag: FeatureFlag): boolean {
  // In a real implementation, this would use React context
  // For now, we'll use the singleton
  return isFeatureEnabled(flag);
}
