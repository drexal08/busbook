import React, { createContext, useContext, useEffect } from 'react';
import { FeatureFlag, isFeatureEnabled } from '../lib/featureFlags';

interface FeatureFlagContextType {
  isEnabled: (flag: FeatureFlag) => boolean;
  setUserId: (userId: string) => void;
  refreshFlags: () => void;
}

const FeatureFlagContext = createContext<FeatureFlagContextType | undefined>(undefined);

interface FeatureFlagProviderProps {
  children: React.ReactNode;
  userId?: string;
}

export const FeatureFlagProvider: React.FC<FeatureFlagProviderProps> = ({ 
  children, 
  userId 
}) => {
  useEffect(() => {
    if (userId) {
      // This would be used to set the user ID in the feature flag manager
      console.log('Setting user ID for feature flags:', userId);
    }
  }, [userId]);

  const setUserId = (newUserId: string) => {
    // This would be used to set the user ID in the feature flag manager
    console.log('Setting user ID for feature flags:', newUserId);
  };

  const refreshFlags = () => {
    // In a real implementation, this would fetch fresh flags from a remote config service
    console.log('Refreshing feature flags...');
  };

  const isEnabled = (flag: FeatureFlag): boolean => {
    return isFeatureEnabled(flag);
  };

  return (
    <FeatureFlagContext.Provider value={{ isEnabled, setUserId, refreshFlags }}>
      {children}
    </FeatureFlagContext.Provider>
  );
};

export const useFeatureFlags = () => {
  const context = useContext(FeatureFlagContext);
  if (!context) {
    throw new Error('useFeatureFlags must be used within FeatureFlagProvider');
  }
  return context;
};

/**
 * Convenience hook to check a single feature flag
 */
export function useFeatureFlag(flag: FeatureFlag): boolean {
  const { isEnabled } = useFeatureFlags();
  return isEnabled(flag);
}
